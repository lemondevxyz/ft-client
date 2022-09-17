//import EventEmitter = require("events")
/*
import { EventEmitter } from "events";
import { EventFsMove } from "./fs";
import { EventOperationError, EventOperationProgress, EventOperationStatus, OperationObject } from "./operation";

export function NewConnection(host: String) : EventEmitter {
    const ee = new EventEmitter();

    const sse = new EventSource("host")
    sse.addEventListener("message", function(e : MessageEvent) {
       switch(e.data.event) {
               // fs events
               case "fs-remove": ee.emit(e.data.event, e.data.data as string);
               case "fs-move":   ee.emit(e.data.event, e.data.data as EventFsMove);
               case "fs-mkdir":  ee.emit(e.data.event, e.data.data as string);
               // operation events
               case "operation-progress": ee.emit("operation-progress", e.data.data as EventOperationProgress);
               case "operation-new":      ee.emit(e.data.event, e.data.data as OperationObject);
               case "operation-done":     ee.emit(e.data.event, e.data.data as string);
               case "operation-status":   ee.emit(e.data.event, e.data.data as EventOperationStatus);
               case "operation-error":    ee.emit(e.data.event, e.data.data as EventOperationError);
       }
    });

    return ee
}
*/
