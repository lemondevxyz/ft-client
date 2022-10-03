//import EventEmitter from 'events';
import { ApiURL, GenericRequest, RequestOptions } from './generic';

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

export function FsURL(host : string, route : string) : string {
  return ApiURL(host, "fs/"+route)
}

export interface FsSizeValue {
  size: number
}

export function FsSize(options: RequestOptions, val: FsGenericData) : Promise<FsSizeValue> {
  return new Promise((resolve, reject) => {
    GenericRequest({url: FsURL(options.host, "size"), id: options.id}, val).then((e : Response) => e.json()).then((data : FsSizeValue) => {
      resolve(data);
    }).catch((e) => reject(e));
  })
}

export function FsRemove(options: RequestOptions, val: FsGenericData) : Promise<Response> {
  return GenericRequest({url: FsURL(options.host, "remove"), id: options.id}, val) };
export function FsMkdir(options: RequestOptions, val: FsGenericData) : Promise<Response> {
  return GenericRequest({url: FsURL(options.host, "mkdir"), id: options.id}, val) }

export interface FsMoveData {
  Src: string
  Dst: string
}

export function FsVerify(options: RequestOptions, val: FsMoveData) : Promise<Response> {
  return GenericRequest({url: FsURL(options.host, "verify"), id: options.id}, val);
}

export function FsMove(options: RequestOptions, val: FsMoveData) : Promise<Response> {
  return GenericRequest({url: FsURL(options.host, "move"), id: options.id}, val)
}

export interface FsReadDirValue {
  files: FsOsFileInfo[]
}

export interface Map<T> {
  [name: string]: T
}

export function FsReadDir(options: RequestOptions, val: FsGenericData) : Promise<FsReadDirValue> {
  return new Promise((resolve, reject) => {
    const eTag : string = JSON.parse(localStorage.getItem("etags") || "{}")[val.Name] || "*";
    const value : FsOsFileInfo[]|undefined = JSON.parse(localStorage.getItem("cache") || "[]")[val.Name];
//   GenericRequest({
//     url: FsURL(options.host, "readdir"),
//     id: options.id}, val).then((resp) => resp.json()).then((data) => resolve(data as FsReadDirValue)).catch((err) => reject(err));

    let headers : Map<string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${options.id}`}
    if(eTag !== "*" && value !== undefined)
      headers["If-None-Match"] = eTag

    fetch(FsURL(options.host, "readdir"), {
      method: "post",
      body: JSON.stringify(val),
      headers,
    }).then((p: Response) => {
      if(p.status !== 304 && p.status !== 200) return reject(p)
      else if(p.status === 304) return resolve({files: value as FsOsFileInfo[]})

      const eTagMap : Map<string> = JSON.parse(localStorage.getItem("etags") || "{}");
      const eTag = p.headers.get("ETag")
      console.log(p.headers)
      if(eTag) eTagMap[val.Name] = eTag;

      localStorage.setItem("etags", JSON.stringify(eTagMap));

      return p.json()
    }).then((p : FsReadDirValue) => {
      const cacheList : Map<FsOsFileInfo[]> = JSON.parse(localStorage.getItem("cache") || "{}")
      cacheList[val.Name] = p.files

      localStorage.setItem("cache", JSON.stringify(cacheList))

      resolve(p);
    }).catch((e) => reject(e))

  })
}

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
    // Sep 19 19:14
    // Sep  9 19:14
    return `${month} ${day} ${d.toTimeString().slice(0, 5)}`;
  // Sep 19  2022
  // Sep  9  2022
  return `${month} ${day}  ${d.getFullYear()}`
}

// FixPath removes any extra forward slashes from a string and returns a valid path
export function FixPath(val : string) : string {
  return "/"+ val.split("/").filter((val : string) => val.length > 0).join("/")
}
