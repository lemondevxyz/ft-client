//import EventEmitter from 'events';
import { ApiURL, GenericRequest } from './generic';

export interface FsOsFileInfo {
    name: string,
    size: number,
    path: string,
    mode: number,
    modTime: string,
}

export interface FsGenericData {
    Name: string
}

export function FsURL(host : string, route : string) : string {
    return ApiURL(host, "fs/"+route)
}

export function FsRemove(host: string, val: FsGenericData) : Promise<Response> { return GenericRequest(FsURL(host, "remove"), val) };
export function FsMkdir(host: string, val: FsGenericData) : Promise<Response> { return GenericRequest(FsURL(host, "mkdir"), val) }

export interface FsMoveData {
    Src: string
    Dst: string
}

export function FsMove(host: string, val: FsMoveData) : Promise<Response> { return GenericRequest(FsURL(host, "mkdir"), val) }

export interface FsReadDirValue {
    files: FsOsFileInfo[]
}

export function FsReadDir(host: string, val: FsGenericData) : Promise<FsReadDirValue> {
    return new Promise((resolve, reject) => {
        GenericRequest(FsURL(host, "readdir"), val).then((resp) => resp.json()).then((data) => resolve(data as FsReadDirValue)).catch((err) => reject(err));
    })
}

export interface EventFsMove {
    Old: string
    New: string
}
