import { ApiURL, RequestOptions, GenericRequest } from './generic';
import { FsOsFileInfo } from './fs';

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

export interface OperationError {
    src: FsOsFileInfo
    dst: string
    error: string
}

export interface OperationObject {
    id: string
    dst: string
    index: number
    src: Array<FsOsFileInfo>
    status: number
    size: number
    log: string
    started: Date
    progress: number
}

export interface EventOperation {
    index: number
    src: string
    status: number
    dst: string
    id: string
}

export interface EventOperationError {
    id: string
    err: OperationError
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

export function OperationNew(options: RequestOptions, val : OperationNewData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "new"), id: options.id}, val) }
export function OperationSetSources(options: RequestOptions, val : OperationSetSourcesData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "set-sources"), id: options.id}, val); }
export function OperationPause(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "pause"), id: options.id}, val) }
export function OperationResume(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "resume"), id: options.id}, val) }
export function OperationStart(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "start"), id: options.id}, val) }
export function OperationExit(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "exit"), id: options.id}, val) }
export function OperationProceed(options: RequestOptions, val : OperationGenericData) : Promise<Response> {
    return GenericRequest({url: OperationURL(options.host, "exit"), id: options.id}, val) }
export function OperationSize(options: RequestOptions, val : OperationGenericData) : Promise<OperationSizeValue> {
    return new Promise((resolve, reject) => {
        GenericRequest({url: OperationURL(options.host, "size"), id: options.id}, val).then((data) => data.json()).then((resp) => {
           resolve(resp as OperationSizeValue);
        }).catch((err) => reject(err));
    })
}