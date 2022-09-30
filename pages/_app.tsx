import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EventOperationLog, EventOperationError, EventOperationProgress, EventOperationStatus, OperationObject, OperationSize, OperationSizeValue, OperationBehaivor, ErrDstAlreadyExists, OperationProceed, OperationPause, OperationSetSources, OperationSetIndex, OperationResume } from '../api/operation';
import EventEmitter from 'events';
import { EventFsMove, FsRemove, HumanSize } from '../api/fs';
import { Mutex } from 'async-mutex'

export const globalHost = "localhost:8080"

export type Map<T> = {
  [name: string]: T
}

export interface PageProps {
  id: string
  ops: Map<OperationObject>
  ev: EventEmitter
  host: string
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [ sseId, setId ] = useState("");
  const [ sseOps, setOps ] = useState<Map<OperationObject>>({});
  const [ init, setInit ] = useState(true);
  const [ ev, _ ] = useState(new EventEmitter());

  useEffect(() => { // eslint-disable-line
    if(!router.isReady) return;
    if(!init) return;

    if(Notification.permission === "default")
      Notification.requestPermission(() => {
        new Notification("Now you can be informed on the latest updates about the operations and file system");
      });

    const mtx = new Mutex();

    let ops : Map<OperationObject> = {};
    const opsSetter = (val : Map<OperationObject>) => {
      setOps(val);
      ops = val;
      window.ops = val;
    }

    setInit(false);

    const sse = new EventSource(`http://${globalHost}/sse`);
    sse.onerror = () => {
      mtx.runExclusive(() => {
        setId("")
        opsSetter({})
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
      const options = {host:globalHost, id:id};
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
          FsRemove(options, { Name: path }).then(() => {
            OperationProceed(options, { id: opId }).then(() => {
              writeChanges(myOp)
            });
          });
          break;
        case OperationBehaivor.Skip:
          OperationSetIndex(options, {id: opId, index: myOp.index+1}).then(() => {
            OperationProceed(options, {id: opId}).then(() => {
              writeChanges(myOp)
            });
          })
          break;
        case OperationBehaivor.Continue:
          OperationProceed(options, {id: opId}).then(() => {
            writeChanges(myOp)
          });
          break;
      }

    })

    let id = ""
    sse.addEventListener("id", (e : MessageEvent<string>) => {
      setId(e.data);
      id = e.data;
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
        let map : Map<OperationObject> = JSON.parse(e.data);
        const myOps = {...ops};
        Object.values(map).forEach((op : OperationObject) => {
          op.started = new Date();

          myOps[op.id] = {...op};
        });

        opsSetter(myOps);
        new Notification(`Found ${Object.keys(myOps).length} operations`)
      })
    })

    sse.addEventListener("operation-new", (e : MessageEvent<string>) => {
      mtx.runExclusive(() => {
        let op : OperationObject = JSON.parse(e.data);
        op.started = new Date();

        let myOps = {...ops}
        myOps[op.id] = op;

        opsSetter(myOps);

        new Notification(`New Operation with ${op.src.length} items with ${HumanSize(op.size)}`)
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

        new Notification(`Operation ${op.id} changed`);
      })
    });

    sse.addEventListener("operation-done", function(e : MessageEvent<string>) {
      mtx.runExclusive(() => {
        let myOps = {...ops}
        delete myOps[e.data];
        opsSetter(myOps);
      })
    })

    sse.addEventListener("operation-error", function(e : MessageEvent<string>) {
      const data : EventOperationError = JSON.parse(e.data);
      mtx.runExclusive(() => {
        if(ops[data.id] === undefined) return;

        const myOp = {...ops[data.id]}
        if(data.error && data.error.length > 0) {
          myOp.err = {...data}
        } else {
          delete myOp.err
        }

        myOp.index = data.index

        const myOps = {...ops};
        myOps[data.id] = myOp;

        opsSetter(myOps)

        // TODO: Skip or replace current file
        if(data.error === ErrDstAlreadyExists) {
          ev.emit("operation-file-exist-err", myOp.id);
        }
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
      new Notification("Directory ${e.data as string} created")
      updateFs(e.data as string)
    });
    sse.addEventListener("fs-remove", (e) => {
      new Notification("${e.data as string} was removed")
      updateFs(e.data as string)
    });
    sse.addEventListener("fs-move", (e : MessageEvent<string>) => {
      const obj : EventFsMove = JSON.parse(e.data);

      updateFs(obj.old)
      updateFs(obj.new)

      new Notification("${obj.old} -> ${obj.new}")
    })
  }) // eslint-disable-line

  pageProps = Object.assign(pageProps, {
    id: sseId,
    ops: sseOps,
    ev,
    host: globalHost,
  });

  return <div className="relative">
    { sseId.length > 0 ? <Component {...pageProps} /> : <p>Waiting for the connection to the server....</p> }
  </div>
}

export default MyApp
