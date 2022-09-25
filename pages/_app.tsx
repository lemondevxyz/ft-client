import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EventOperationProgress, EventOperationStatus, EventOperationError, OperationObject, OperationSize, OperationSizeValue } from '../api/operation';
import EventEmitter from 'events';
import { EventFsMove } from '../api/fs';

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
  const [ ops, setOps ] = useState<Map<OperationObject>>({});
  const [ progress, setProgress ] = useState<Map<number>>({});
  const [ init, setInit ] = useState(true);
  const [ ev, _ ] = useState(new EventEmitter());

  const opsSetter = (val : Map<OperationObject>) => {
    setOps(val);
    ev.emit("ops");
  }

  const progressSetter = (val : Map<number>) => {
    setProgress(val)
    ev.emit("progress");
  }

  const opSizeCallback = (op : OperationObject) =>
    (e: OperationSizeValue) => {
      op.size = e.size;
      ops[op.id] = op;
      console.log(op, ops)

      opsSetter(ops);
    }

  useEffect(() => { // eslint-disable-line
    if(!router.isReady) return;
    if(!init) return;

    if(Notification.permission === "default")
      Notification.requestPermission(() => {
        new Notification("Now you can be informed on the latest updates about the operations and file system");
      });

    setInit(false);

    const sse = new EventSource("http://localhost:8080/sse");

    let id = ""
    sse.addEventListener("id", (e : MessageEvent<string>) => {
      setId(e.data);
      id = e.data;
      console.log("data has been set", e.data, id);
    });

    sse.addEventListener("operation-all", function(e : MessageEvent<string>) {
      let map : Map<OperationObject> = JSON.parse(e.data);
      //console.log("here", map);
      Object.values(map).forEach((op : OperationObject) => {
        op.started = new Date();
        console.log("operation/all", id, op.id)
        OperationSize({
          host: globalHost,
          id: id,
        }, {id: op.id}).then(opSizeCallback(op))
      });

      ev.emit("op")
    })

    sse.addEventListener("operation-new", function(e : MessageEvent<string>) {
      let op : OperationObject = JSON.parse(e.data);
      op.started = new Date();

      console.log("operation/new", id, op.id)
      OperationSize({
        host: globalHost,
        id: id,
      }, {id: op.id}).then(opSizeCallback(op));
      ev.emit("op")
    })

    sse.addEventListener("operation-done", function(e : MessageEvent<string>) {
      delete ops[e.data];
      opsSetter(ops);

      ev.emit("op");
    })

    sse.addEventListener("operation-error", function(e : MessageEvent<string>) {
      console.log("op-err", e.data)
    });

    sse.addEventListener("operation-status", function(e : MessageEvent<string>) {
      const ev : EventOperationStatus = JSON.parse(e.data);

      if(ops !== undefined && ops[ev.id] !== undefined) {
        ops[ev.id].status = ev.status
        opsSetter(ops);
      }
    })

    sse.addEventListener("operation-progress", function(e : MessageEvent<string>) {
      const ev : EventOperationProgress = JSON.parse(e.data);

      console.log(ops, progress, ev)
      if(ops !== undefined && ops[ev.id] !== undefined) {
        ops[ev.id].index = ev.index;
        progress[ev.id] = ev.size;

        progressSetter(progress);
        opsSetter(ops);
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
    ops,
    progress,
    ev,
    host: globalHost,
  });

  return <div className="relative">
    { sseId.length > 0 ? <Component {...pageProps} /> : <p>Waiting for the connection to the server....</p> }
  </div>
}

export default MyApp
