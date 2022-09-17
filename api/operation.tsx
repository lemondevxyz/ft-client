import { ApiURL, GenericRequest } from './generic';
import { FsOsFileInfo } from './fs';

export function OperationURL(host : string, route : string) : string {
    return ApiURL(host, "/op/"+route)
}

export interface OperationGenericData {
    ID: string
}

export interface OperationNewData {
    WriterID: string
    Src: string
    Dst: string
}

export interface OperationSetSourcesData extends OperationGenericData {
    Srcs: string[]
}

export interface OperationError {
    Src: FsOsFileInfo
    Dst: string
    Error: string
}

export interface OperationObject {
    ID: string,
    Owner: string,
    Destination: string,
    Index: number,
    Sources: Array<FsOsFileInfo>,
    Status: number,
}

export interface EventOperation {
    Index: number
    Src: string
    Status: number
    Dst: string
    ID: string
}

export interface EventOperationError {
    ID: string
    Err: OperationError
}

export interface EventOperationProgress {
    ID: string
    Index: number
    Size: number
}

export interface EventOperationStatus {
    ID: string
    Status: number
}

/*
export function OperationNew(host : string, val : OperationNewData) : Promise<OperationGenericData> {
    return new Promise((resolve, reject) => {
        GenericRequest(OperationURL(host, "new"), val).then((data) => data.json()).then((resp) => {
            resolve(resp as OperationGenericData)
        }).catch((err) => reject(err));
    })
}
*/

export function OperationNew(host : string, val : OperationNewData) : Promise<Response> { return GenericRequest(OperationURL(host, "new"), val) }
export function OperationSetSources(host : string, val : OperationSetSourcesData) : Promise<Response> { return GenericRequest(OperationURL(host, "set-sources"), val); }
export function OperationPause(host : string, val : OperationGenericData) : Promise<Response> { return GenericRequest(OperationURL(host, "pause"), val) }
export function OperationResume(host : string, val : OperationGenericData) : Promise<Response> { return GenericRequest(OperationURL(host, "resume"), val) }
export function OperationStart(host : string, val : OperationGenericData) : Promise<Response> { return GenericRequest(OperationURL(host, "start"), val) }
export function OperationExit(host : string, val : OperationGenericData) : Promise<Response> { return GenericRequest(OperationURL(host, "exit"), val) }
export function OperationProceed(host : string, val : OperationGenericData) : Promise<Response> { return GenericRequest(OperationURL(host, "proceed"), val) }
