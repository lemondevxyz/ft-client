//import EventEmitter from 'events';
import { ApiURL, returnResponse, Response, returnPromise } from './generic';
import useSWR from 'swr';
import { FullConfiguration } from 'swr/dist/types';

export interface FsOsFileInfo {
  name: string,
  size: number,
  path: string,
  absPath: string,
  mode: number,
  modTime: string,
  dirSize?: number,
}

export interface FsGenericData {
  Name: string
}

export function FsURL(route : string) : string {
  return ApiURL("fs/"+route)
}

export interface FsSizeValue {
  size: number
}

export function PromiseFsSize(cfg : FullConfiguration, val : FsGenericData) : Promise<FsSizeValue> {
  return returnPromise(cfg, FsURL("size"), val) as Promise<FsSizeValue> }

export function FsSize(val: FsGenericData) : Response<FsSizeValue> {
  return returnResponse(useSWR([FsURL("size"), val])) as Response<FsSizeValue>; }

export function PromiseFsRemove(cfg : FullConfiguration, val : FsGenericData) : Promise<any> {
  return returnPromise(cfg, FsURL("remove"), val) as Promise<any> }

export function FsRemove(val: FsGenericData) : Response<any> {
  return returnResponse(useSWR([FsURL("remove"), val])); };

export function PromiseFsMkdir(cfg : FullConfiguration, val : FsGenericData) : Promise<any> {
  return returnPromise(cfg, FsURL("mkdir"), val) as Promise<any> }

export function FsMkdir(val: FsGenericData) : Response<any> {
  return returnResponse(useSWR([FsURL("mkdir"), val])); }

export interface FsMoveData {
  Src: string
  Dst: string
}

export function PromiseFsVerify(cfg : FullConfiguration, val : FsMoveData) : Promise<any> {
  return returnPromise(cfg, FsURL("verify"), val) as Promise<any> }

export function FsVerify(val: FsMoveData) : Response<any> {
  return returnResponse(useSWR([FsURL("verify"), val])) }

export function PromiseFsMove(cfg : FullConfiguration, val : FsMoveData) : Promise<any> {
  return returnPromise(cfg, FsURL("move"), val) as Promise<any> }

export function FsMove(val: FsMoveData) : Response<any> {
  return returnResponse(useSWR([FsURL("move"), val])) }

export interface FsReadDirValue {
  files: FsOsFileInfo[]
}

export interface Map<T> {
  [name: string]: T
}

export function PromiseFsReaddir(cfg : FullConfiguration, val : FsGenericData) : Promise<FsReadDirValue> {
  return cfg!.fetcher!(FsURL("readdir"), val) as Promise<FsReadDirValue> }

export function FsReadDir(val: FsGenericData) : Response<FsReadDirValue> {
  return returnResponse(useSWR([FsURL("readdir"), val])) as Response<FsReadDirValue> }


// export function FsReadDir(options: RequestOptions, val: FsGenericData) : Promise<FsReadDirValue> {
//   return new Promise((resolve, reject) => {
//     const eTag : string = JSON.parse(localStorage.getItem("etags") || "{}")[val.Name] || "*";
//     const value : FsOsFileInfo[]|undefined = JSON.parse(localStorage.getItem("cache") || "[]")[val.Name];
//
//     let headers : Map<string> = {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//         'Authorization': `Bearer ${options.id}`}
//     if(eTag !== "*" && value !== undefined)
//       headers["If-None-Match"] = eTag
//
//     fetch(FsURL(options.host, "readdir"), {
//       method: "post",
//       body: JSON.stringify(val),
//       headers,
//     }).then((p: Response) => {
//       if(p.status !== 304 && p.status !== 200) return reject(p)
//       else if(p.status === 304) return resolve({files: value as FsOsFileInfo[]})
//
//       const eTagMap : Map<string> = JSON.parse(localStorage.getItem("etags") || "{}");
//       const eTag = p.headers.get("ETag")
//       console.log(p.headers)
//       if(eTag) eTagMap[val.Name] = eTag;
//
//       localStorage.setItem("etags", JSON.stringify(eTagMap));
//
//       return p.json()
//     }).then((p : FsReadDirValue) => {
//       const cacheList : Map<FsOsFileInfo[]> = JSON.parse(localStorage.getItem("cache") || "{}")
//       cacheList[val.Name] = p.files
//
//       localStorage.setItem("cache", JSON.stringify(cacheList))
//
//       resolve(p);
//     }).catch((e) => reject(e))
//
//   })
// }

export interface EventFsMove {
  old: string
  new: string
}

export const DirMode = 2147483648;

export function SortByDirectory(a : FsOsFileInfo, b : FsOsFileInfo) : number {
  if(IsDirectory(a) && !IsDirectory(b))
    return -1;
  else if (!IsDirectory(a) && IsDirectory(b))
    return 1;
  return 0;
}

export function IsDirectory(a : FsOsFileInfo) {
  return (a.mode&DirMode) != 0
}

export const bytes = 1;
export const kb = 1024 * bytes;
export const mb = 1024 * kb;
export const gb = 1024 * mb;
export const tb = 1024 * gb;

export function UpTo2Points(x : number, y : number) : String {
  return (Math.floor((x*100) / y)/100).toString()
}

export function HumanSize(n : number) : String {
  if(n >= tb) return `${UpTo2Points(n, tb)} TB`;
  else if (n >= gb) return `${UpTo2Points(n, gb)} GB`;
  else if (n >= mb) return `${UpTo2Points(n, mb)} MB`;
  else if (n >= kb) return `${UpTo2Points(n, kb)} KB`;

  return `${(Math.floor(n).toString())} bytes`
}

export function HumanDate(d : Date) {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  let day = d.getDate().toString();
  if(day.length == 1) day = " " + day;

  const month = months[d.getMonth()].slice(0, 3);

  if(d.getFullYear() == new Date().getFullYear())
    return `${month} ${day} ${d.toTimeString().slice(0, 5)}`;

  return `${month} ${day}  ${d.getFullYear()}`
}

// FixPath removes any extra forward slashes from a string and returns a valid path
export function FixPath(val : string) : string {
  return "/"+ val.split("/").filter((val : string) => val.length > 0).join("/")
}

export function GetReadDirKey(pwd : string) : string {
 return `@"/api/v0/fs/readdir",#Name:"${pwd}",,`
}
