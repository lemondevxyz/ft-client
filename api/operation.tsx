import { ApiURL, RequestOptions, GenericRequest } from './generic';
import { FsOsFileInfo } from './fs';

// errors
export const ErrDstAlreadyExists = "dst file already exists"

export enum OperationStatus {
    Default,
    Started,
    Finished,
    Aborted,
    Paused,
}

export function OperationURL(host: string, route : string) : string {
    return ApiURL(host, "op/"+route)
}

export interface OperationSizeValue {
    size: number
}

export interface OperationGenericData {
    id: string
}

export interface OperationNewData {
    writer_id: string
    src: string[]
    dst: string
}

export interface OperationSetSourcesData extends OperationGenericData {
    srcs: string[]
}

export interface OperationSetIndexData extends OperationGenericData {
    index: number
}

export interface OperationError {
    src: FsOsFileInfo
    dst: string
    error: string
    index: number
}

export enum OperationBehaivor {
    Default,
    Skip,
    Replace,
    Continue,
}

export interface OperationObject {
    id: string
    dst: string
    index: number
    src: Array<FsOsFileInfo>
    status: number
    size: number
    // extra fields created by client
    log: string
    started: Date
    progress: number
    behaivor: OperationBehaivor
    keepBehaivor: boolean
    updateObject: () => any,
    err?: OperationError
}

export interface EventOperation {
    index: number
    src: string
    status: number
    dst: string
    id: string
}

export interface EventOperationError extends OperationError {
    id: string
}

export interface EventOperationProgress {
    id: string
    index: number
    size: number
}

export interface EventOperationStatus {
    id: string
    status: number
}

export interface EventOperationLog {
    id: string
    message: string
}

export function OperationNew(options: RequestOptions, val : OperationNewData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "new"), id: options.id}, val) }
export function OperationSetSources(options: RequestOptions, val : OperationSetSourcesData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "set-sources"), id: options.id}, val); }
export function OperationSetIndex(options: RequestOptions, val : OperationSetIndexData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "set-index"), id: options.id}, val); }
export function OperationPause(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "status"), id: options.id}, {
        id: val.id,
        status: OperationStatus.Paused
    })}
export function OperationResume(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "status"), id: options.id}, {
        id: val.id,
        status: OperationStatus.Started
    })}
export function OperationStart(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "status"), id: options.id}, {
        id: val.id,
        status: OperationStatus.Started
    })}
export function OperationExit(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "status"), id: options.id}, {
        id: val.id,
        status: OperationStatus.Aborted
    })}
export function OperationProceed(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "proceed"), id: options.id}, val) }
export function OperationSize(options: RequestOptions, val : OperationGenericData) : Promise<OperationSizeValue> {
    return new Promise((resolve, reject) => {
        GenericRequest({url: OperationURL(options.host, "size"), id: options.id}, val).then((data) => data.json()).then((resp) => {
           resolve(resp as OperationSizeValue);
        }).catch((err) => reject(err));
    })
}
