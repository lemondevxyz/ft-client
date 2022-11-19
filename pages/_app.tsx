import '../styles/globals.css'
import getConfig from 'next/config'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EventOperationLog, EventOperationError, EventOperationProgress, OperationObject, OperationBehaivor, ErrDstAlreadyExists, OperationSetIndex, OperationResume } from '../api/operation';
import EventEmitter from 'events';
import { EventFsMove, FsGenericData, HumanSize, PromiseFsRemove } from '../api/fs';
import { Mutex } from 'async-mutex'
import { SWRConfig, useSWRConfig } from 'swr';
import { Loader } from '../components/loading';
import { AnimatedComponent } from '../components/animated';
import { ToastContainer } from '../components/toast';

const { publicRuntimeConfig } = getConfig();
export const globalHost : string = publicRuntimeConfig.api_host

export type ObjectMap<T> = {
  [name: string]: T
}

export interface PageProps {
  id: string
  ops: ObjectMap<OperationObject>
  ev: EventEmitter
  host: string
}

function SWRFetcher(sseId : string, mEtag : Map<string, any>, mData : Map<string, any>) {
  return async (url : string, body : any) => {
    let etag = ""
    if(url.endsWith("readdir"))
      etag = mEtag.get((body as FsGenericData).Name) || ""

    if(etag.length > 0)
      mData.get((body as FsGenericData).Name).length == 0 &&
             mData.delete((body as FsGenericData).Name)

    const headers : HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${sseId}`,
    }

    if(etag.length > 0) headers["If-None-Match"] = etag;

    const res = await fetch(publicRuntimeConfig.api_host+ url, {
      headers,
      body: JSON.stringify(body),
      method: "POST",
    });

    if(res.status == 304)
      return Promise.resolve(mData.get((body as FsGenericData).Name))
    if(!res.ok) throw new Error(res.statusText)

    return new Promise((resolv, _) => {
      if(url.endsWith("readdir") && res.headers.get!("ETag") !== null) {
        mEtag.set((body as FsGenericData).Name, res.headers.get("ETag"))
        res.json().then((val : any) => {
          mData.set((body as FsGenericData).Name, val)
          resolv(val)
        })
      } else {
        res.json().then((val : any) =>
          resolv(val))
      }
    })
  }
}

class LocalStorageMap extends Map<any, any> {
  name: string
  constructor(name : string, map : Map<any, any>) {
    super(map);
    this.name = name;
  }

  set(key : any, val : any) {
    super.set(key, val)

    if(this.name === undefined) return this;

    localStorage.setItem(this.name, JSON.stringify(Array.from(super.entries())))
    return this;
  }
}

function SWRCache(name : string) {
  let map = new Map();
  if(typeof window !== 'undefined' && localStorage) {
    map = new Map(JSON.parse(localStorage.getItem(name) || '[]'));

    map = new LocalStorageMap(name, map)
  }

  return map
}

function MyApp({ Component }: AppProps<PageProps>) {
  const router = useRouter();
  const [ sseId, setId ] = useState("");
  const [ sseOps, setOps ] = useState<ObjectMap<OperationObject>>({});
  const [ init, setInit ] = useState(true);
  const [ ev, _ ] = useState(new EventEmitter());

  const mEtag = SWRCache("etag");
  const mData = SWRCache("data");

  const cfg = Object.assign({}, useSWRConfig(), {
    fetcher: SWRFetcher(sseId, mEtag, mData),
  });

  useEffect(() => { // eslint-disable-line
    if(!router.isReady || !init) return;

    const mtx = new Mutex();

    let ops : ObjectMap<OperationObject> = {};
    const opsSetter = (val : ObjectMap<OperationObject>) => {
      setOps(val);
      ops = val;
//      window.ops = val;
    }

    setInit(false);

    const sse = new EventSource(`${globalHost}/api/v0/sse`);
    sse.onerror = () => {
      mtx.runExclusive(() => {
        setId("")
        opsSetter({})

        ev.emit("toast-insert", "Lost connection to server; reconnecting soon")
      })
    }

    ev.addListener("operation-set", (val: OperationObject) => {
      mtx.runExclusive(() => {
        const myOps = {...ops}
        myOps[val.id] = val;

        opsSetter(myOps);
      })
    })

    ev.addListener("operation-file-exist-err", ({ opId } : {opId: string}) => {
      mtx.runExclusive(() => {
        const myOp = {...ops[opId]};

        const writeChanges = (op: OperationObject) => {
          mtx.runExclusive(() => {
            if(ops[opId] === undefined) return;

            const myOps = {...ops};
            if(!op.keepBehaivor) {
              op.behaivor = OperationBehaivor.Default;
            }
            delete op.err

            myOps[opId] = {...op};

            opsSetter(myOps)
          })
        }

        switch(myOp.behaivor) {
          case OperationBehaivor.Replace:
            const path = myOp.dst.split("/").concat(myOp.src[myOp.index].path.split("/")).join("/");
            PromiseFsRemove(cfg, { Name: path }).then(() => {
              OperationResume(cfg, { id: opId }).then(() => {
                writeChanges(myOp)
              });
            });
            break;
          case OperationBehaivor.Skip:
            OperationSetIndex(cfg, {id: opId, index: myOp.index+1}).then(() => {
              OperationResume(cfg, {id: opId}).then(() => {
                writeChanges(myOp)
              });
            })
            break;
          case OperationBehaivor.Continue:
            OperationResume(cfg, {id: opId}).then(() => {
              writeChanges(myOp)
            });
            break;
        }
      })
    })

    sse.addEventListener("id", (e : MessageEvent<string>) => {
      setId(e.data);
    });

    sse.addEventListener("operation-log", function(e : MessageEvent<string>) {
      mtx.runExclusive(() => {
        const obj : EventOperationLog = JSON.parse(e.data);

        if(ops[obj.id] !== undefined) {
          const myOps = {...ops};
          const myOp : OperationObject|undefined = {...myOps[obj.id]}

          if(myOp.log === undefined) myOp.log = "";

          myOp.log += obj.message;
          myOps[obj.id] = myOp;

          opsSetter(myOps);
        }
      })
    });

    sse.addEventListener("operation-all", function(e : MessageEvent<string>) {
      mtx.runExclusive(() => {
        let map : ObjectMap<OperationObject> = JSON.parse(e.data);
        const myOps = {...ops};
        Object.values(map).forEach((op : OperationObject) => {
          op.started = new Date();

          myOps[op.id] = {...op};
        });

        opsSetter(myOps);
        //new Notification(`Found ${Object.keys(myOps).length} operations`)
        ev.emit("toast-insert", `Found ${Object.keys(myOps).length} operations`)
      })
    })

    sse.addEventListener("operation-new", (e : MessageEvent<string>) => {
      mtx.runExclusive(() => {
        let op : OperationObject = JSON.parse(e.data);
        op.started = new Date();

        let myOps = {...ops}
        myOps[op.id] = op;

        opsSetter(myOps);

        ev.emit("toast-insert", `New Operation with ${op.src.length} items with ${HumanSize(op.size)}`)
      })
    });

    sse.addEventListener("operation-update", (e : MessageEvent<string>) => {
      mtx.runExclusive(() => {
        let op : OperationObject = JSON.parse(e.data);

        if(ops[op.id] === undefined) return;

        op.started = new Date();

        let myOps = {...ops}
        myOps[op.id] = Object.assign({...myOps[op.id]}, op);

        opsSetter(myOps);

        ev.emit("toast-insert", `Operation ${op.id} was updated`)
      })
    });

    sse.addEventListener("operation-done", function(e : MessageEvent<string>) {
      mtx.runExclusive(() => {
        console.log(ops[e.data].log)

        let myOps = {...ops}
        delete myOps[e.data];

        opsSetter(myOps);

        ev.emit("toast-insert", `Operation ${e.data} has finished`)
      })
    })

    sse.addEventListener("operation-error", function(e : MessageEvent<string>) {
      const data : EventOperationError = JSON.parse(e.data);
      mtx.runExclusive(() => {
        if(ops[data.id] === undefined) return;

        const myOp = {...ops[data.id]}
        if(data.error && data.error.length > 0) {
          ev.emit("toast-insert", `An error has occurred with operation ${data.id}`);
          myOp.err = {...data}
        } else {
          delete myOp.err
        }

        myOp.index = data.index

        const myOps = {...ops};
        myOps[data.id] = myOp;

        setTimeout(() => {
          mtx.runExclusive(() => {
            if(ops[data.id] === undefined) return;
            opsSetter(myOps)
          })
        }, 500)
      })
    });

    sse.addEventListener("operation-progress", function(e : MessageEvent<string>) {
      const ev : EventOperationProgress = JSON.parse(e.data);

      mtx.runExclusive(() => {
        if(ops !== undefined && ops[ev.id] !== undefined) {
          const myOps = {...ops}
          const myOp = {...myOps[ev.id]}
          myOp.index = ev.index;
          myOp.progress = ev.size;

          myOps[ev.id] = myOp;

          opsSetter(myOps);
        }
      })
    });

    let updateFs = (e : string) => ev.emit("fs-update", e);

    sse.addEventListener("fs-mkdir", (e) => {
      ev.emit("toast-insert", `Directory ${e.data as string} created`)
      updateFs(e.data as string)
    });
    sse.addEventListener("fs-remove", (e) => {
      ev.emit("toast-insert", `${e.data as string} was removed`)
      updateFs(e.data as string)
    });
    sse.addEventListener("fs-move", (e : MessageEvent<string>) => {
      const obj : EventFsMove = JSON.parse(e.data);

      updateFs(obj.old)
      updateFs(obj.new)

      //new Notification("${obj.old} -> ${obj.new}")
      ev.emit("toast-insert", `${obj.old} -> ${obj.new}`)
    })
  }) // eslint-disable-line

  const pageProps : PageProps = {
    id: sseId,
    ops: sseOps,
    ev,
    host: globalHost,
  }

  const [show, setShow] = useState(false);

  return (<SWRConfig
           value={cfg}>
    <div className="relative">
      <AnimatedComponent {...{
          elem: <Loader />,
          className: "z-50",
          classIn: "animate-longFadeIn",
          classOut: "animate-longFadeOut",
          show: sseId.length == 0 || !router.isReady,
          duration: 1000,
          setShowOutsider: (val : boolean) => {
            setTimeout(() => setShow(val), 200) },
          showRightAway: true,
        }} />
        {router.isReady && show && <Component {...pageProps} />}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 mx-4 pr-32 w-full sm:pr-none sm:mx-none sm:w-1/2 md:w-1/2 lg:w-1/3 text-white">
          <ToastContainer {...{ev: ev}} />
        </div>
    </div>
  </SWRConfig>
  )
}

export default MyApp
