import { ApiURL, GenericRequest } from './generic';
import { FsOsFileInfo } from './fs';

export function OperationURL(host : string, route : string) : string {
    return ApiURL(host, "op/"+route)
}

export interface OperationSizeValue {
    size: number
}

export interface OperationGenericData {
    ID: string
}

export interface OperationNewData {
    writer_id: string
    src: string
    dst: string
}

export interface OperationSetSourcesData extends OperationGenericData {
    srcs: string[]
}

export interface OperationError {
    src: FsOsFileInfo
    dst: string
    error: string
}

export interface OperationObject {
    id: string,
    owner: string,
    destination: string,
    index: number,
    sources: Array<FsOsFileInfo>,
    status: number,
}

export interface EventOperation {
    index: number
    src: string
    status: number
    dst: string
    iD: string
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
export function OperationSize(host : string, val : OperationGenericData) : Promise<OperationSizeValue> {
    return new Promise((resolve, reject) => {
        GenericRequest(OperationURL(host, "size"), val).then((data) => data.json()).then((resp) => {
           resolve(resp as OperationSizeValue);
        }).catch((err) => reject(err));
    })
}
