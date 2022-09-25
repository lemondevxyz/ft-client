import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EventOperationProgress, EventOperationStatus, OperationObject, OperationSize, OperationSizeValue } from '../api/operation';
import EventEmitter from 'events';
import { EventFsMove, HumanSize } from '../api/fs';

export const globalHost = "localhost:8080"

export type Map<T> = {
  [name: string]: T
}

export interface PageProps {
  id: string
  ops: Map<any>
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

    let ops : Map<OperationObject> = {};
    const opsSetter = (val : Map<OperationObject>) => {
      setOps(val);
      ops = val;
    }

    setInit(false);

    const sse = new EventSource("http://localhost:8080/sse");

    let id = ""
    sse.addEventListener("id", (e : MessageEvent<string>) => {
      setId(e.data);
      id = e.data;
    });

    sse.addEventListener("operation-all", function(e : MessageEvent<string>) {
      let map : Map<OperationObject> = JSON.parse(e.data);
      //console.log("here", map);
      const myOps = {...ops};
      Object.values(map).forEach((op : OperationObject) => {
        op.started = new Date();

        myOps[op.id] = {...op};
      });

      opsSetter(myOps);
      new Notification(`Found ${Object.keys(myOps).length} operations`)
    })

    sse.addEventListener("operation-new", (e : MessageEvent<string>) => {
      let op : OperationObject = JSON.parse(e.data);
      op.started = new Date();

      let myOps = {...ops}
      myOps[op.id] = op;

      opsSetter(myOps);

      new Notification(`New Operation with ${op.src.length} items with ${HumanSize(op.size)}`)
    });
    sse.addEventListener("operation-update", (e : MessageEvent<string>) => {
        let op : OperationObject = JSON.parse(e.data);
      op.started = new Date();

      let myOps = {...ops}
      myOps[op.id] = op;

      opsSetter(myOps);

      new Notification(`Operation ${op.id} changed`);
    });

    sse.addEventListener("operation-done", function(e : MessageEvent<string>) {
      let myOps = {...ops}
      delete myOps[e.data];
      opsSetter(myOps);
    })

    sse.addEventListener("operation-error", function(e : MessageEvent<string>) {
      console.log("op-err", e.data)
    });

    sse.addEventListener("operation-progress", function(e : MessageEvent<string>) {
      const ev : EventOperationProgress = JSON.parse(e.data);

      if(ops !== undefined && ops[ev.id] !== undefined) {
        const myOps = {...ops}
        const myOp = {...myOps[ev.id]}
        myOp.index = ev.index;
        myOp.progress = ev.size;

        myOps[ev.id] = myOp;

        opsSetter(myOps);
      }
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
