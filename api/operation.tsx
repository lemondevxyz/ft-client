import { ApiURL, RequestOptions, returnPromise } from './generic';
import { FsOsFileInfo } from './fs';
import { FullConfiguration } from 'swr';

// errors
export const ErrDstAlreadyExists = "dst file already exists"

export enum OperationStatus {
    Default,
    Started,
    Finished,
    Aborted,
    Paused,
}

export function OperationURL(route : string) : string {
    return ApiURL("op/"+route)
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

export function OperationNew(cfg : FullConfiguration, val : OperationNewData) : Promise<Response> {
    return returnPromise(cfg, OperationURL("new"), val) }
export function OperationSetSources(cfg : FullConfiguration, val : OperationSetSourcesData) : Promise<Response> {
    return returnPromise(cfg, OperationURL("set-sources"), val) }
export function OperationSetIndex(cfg : FullConfiguration, val : OperationSetIndexData) : Promise<Response> {
    return returnPromise(cfg, OperationURL("set-index"), val) }

interface OperationStatusData {
    id: string
    status: OperationStatus,
}

function PromiseOperationStatus(cfg : FullConfiguration, val : OperationStatusData) : Promise<Response> {
    return returnPromise(cfg, OperationURL("status"), val) }
export function OperationResume(cfg : FullConfiguration, val : OperationGenericData) : Promise<Response> {
    return PromiseOperationStatus(cfg, { id: val.id, status: OperationStatus.Started }) }
export function OperationStart(cfg : FullConfiguration, val : OperationGenericData) : Promise<Response> {
    return PromiseOperationStatus(cfg, { id: val.id, status: OperationStatus.Started }) }
export function OperationExit(cfg : FullConfiguration, val : OperationGenericData) : Promise<Response> {
    return PromiseOperationStatus(cfg, { id: val.id, status: OperationStatus.Aborted }) }
export function OperationPause(cfg : FullConfiguration, val : OperationGenericData) : Promise<Response> {
    return PromiseOperationStatus(cfg, { id: val.id, status: OperationStatus.Paused }) }

export function OperationSize(cfg : FullConfiguration, val : OperationGenericData) : Promise<OperationSizeValue> {
    return new Promise((resolv, reject) => {
        returnPromise(cfg, OperationURL("size"), val)
            .catch((e : Error) => reject(e))
            .then((d : any) => resolv(d as OperationSizeValue))
    })}
