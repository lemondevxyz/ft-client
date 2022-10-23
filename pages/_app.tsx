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
  ev: Emitter
  host: string
}

export interface Emitter {
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  emit(eventName: string | symbol, ...args: any[]): boolean;
}

function MyApp({ Component }: AppProps<PageProps>) {
  const router = useRouter();
  const [ sseId, setId ] = useState("");
  const [ sseOps, setOps ] = useState<Map<OperationObject>>({});
  const [ init, setInit ] = useState(true);
  const [ ev, _ ] = useState(new EventEmitter());

  useEffect(() => { // eslint-disable-line
    if(!router.isReady || !init) return;

    const mtx = new Mutex();

    let ops : Map<OperationObject> = {};
    const opsSetter = (val : Map<OperationObject>) => {
      setOps(val);
      ops = val;
    }

    setInit(false);

    const sse = new EventSource(`http://${globalHost}/api/v0/sse`);
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
            console.log("skippy", myOp.index)
            OperationPause(options, { id: opId }).then(() => {
              OperationSetIndex(options, {id: opId, index: myOp.index+1}).then(() => {
                OperationResume(options, {id: opId}).then(() => {
                  OperationProceed(options, {id: opId}).then(() => {
                    writeChanges(myOp)
                  });
                })
              })
            })
            break;
          case OperationBehaivor.Continue:
            OperationProceed(options, {id: opId}).then(() => {
              writeChanges(myOp)
            });
            break;
        }

      })
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
      }).then(() => {
        if(data.error === ErrDstAlreadyExists) {
          ev.emit("operation-file-exist-err", data.id);
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

  const pageProps = {
    id: sseId,
    ops: sseOps,
    ev: ev as Emitter,
    host: globalHost,
  }


  return <div className="relative">
    { sseId.length > 0 ? <Component {...pageProps} /> : <p>Waiting for the connection to the server....</p> }
  </div>
}

export default MyApp
