import { FsOsFileInfo, FixPath, IsDirectory, FsReadDirValue, PromiseFsReaddir } from "../api/fs";
import { ReactElement } from "react";
import { iconFolder, iconFile } from "./file";
import { useSWRConfig } from "swr";
import EventEmitter from "events";

export interface TreeMap {
  [name: string]: FsOsFileInfo[],
}

export interface TreeObject {
  tree?: TreeMap,
  setTree: (val : TreeMap) => any,
  setPwd: (pwd : string) => any,
  path: string,
  ev: EventEmitter,
}

export function Tree(props: TreeObject) : ReactElement[] {
  const cfg = useSWRConfig();

  if(props.tree === undefined) return []
  let arr : ReactElement[] = [];

  const onClick = function(localPath: string) {
    let obj = Object.assign({}, props.tree);
    let paths : string[] = [];
    if(obj[localPath] !== undefined) {
      Object.keys(obj).forEach((v : string) => {
        if(v.includes(localPath)) paths.push(v);
      });
      paths.forEach((val : string) => delete obj[val]);

      props.setTree(obj)
      return;
    }

    PromiseFsReaddir(cfg, { Name: localPath }).then((data : FsReadDirValue) => {
        obj[localPath] = data.files
        props.setTree(obj);
    })
  }

  const onContextMenu = function(localPath : string) {
    console.log("asdfodsafpokasd")

    const path = FixPath("/"+localPath)
    props.setPwd(path);
  }

  if(props.tree[props.path] !== undefined)
    props.tree[props.path].forEach((val : FsOsFileInfo, index: number) => {
      if(!IsDirectory(val)) return;

      const localPath = FixPath(props.path+"/"+val.name)

      let fileInfo = (props.tree || {})[localPath] // eslint-disable-line
      let later : ReactElement[] = [];
      if(fileInfo !== undefined) {
        let obj = Object.assign({}, props, {path: localPath})
        later = later.concat(<div className="ml-1" key={"children:"+localPath+"/"}>
          {Tree(obj)}
        </div>)
      }

      arr = arr.concat(
        <div className="my-1" key={localPath+index}>
          <div className="flex items-center text-sm cursor-pointer select-none" onClick={() => onClick(localPath)} onContextMenu={(e) => { e.preventDefault(); onContextMenu(localPath)}}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width: '1.5em', height: '1.5em'}} className="mr-2 flex-shrink">
              <path d={IsDirectory(val) ? iconFolder : iconFile} />
            </svg>
            <p className="overflow-hidden" style={{
              wordBreak: "keep-all",
              textOverflow: "ellipsis",
            }}>{val.name}</p>
          </div>
          {later}
        </div>
      )
    })

  return arr;
}
