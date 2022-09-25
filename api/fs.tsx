//import EventEmitter from 'events';
import { ApiURL, GenericRequest, RequestOptions } from './generic';

export interface FsOsFileInfo {
  name: string,
  size: number,
  path: string,
  absPath: string,
  mode: number,
  modTime: string,
}

export interface FsGenericData {
  Name: string
}

export function FsURL(host : string, route : string) : string {
  return ApiURL(host, "fs/"+route)
}

export function FsRemove(options: RequestOptions, val: FsGenericData) : Promise<Response> {
  return GenericRequest({url: FsURL(options.host, "remove"), id: options.id}, val) };
export function FsMkdir(options: RequestOptions, val: FsGenericData) : Promise<Response> {
  return GenericRequest({url: FsURL(options.host, "mkdir"), id: options.id}, val) }

export interface FsMoveData {
  Src: string
  Dst: string
}

export function FsMove(options: RequestOptions, val: FsMoveData) : Promise<Response> { return GenericRequest(FsURL(host, "mkdir"), val) }

export interface FsReadDirValue {
  files: FsOsFileInfo[]
}

export function FsReadDir(options: RequestOptions, val: FsGenericData) : Promise<FsReadDirValue> {
  return new Promise((resolve, reject) => {
    GenericRequest({
      url: FsURL(options.host, "readdir"),
      id: options.id}, val).then((resp) => resp.json()).then((data) => resolve(data as FsReadDirValue)).catch((err) => reject(err));
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
