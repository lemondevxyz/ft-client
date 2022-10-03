import { FsOsFileInfo, FixPath, FsReadDir, FsReadDirValue, IsDirectory } from "../api/fs";
import { ReactElement } from "react";
import { FileComponentFilename, FileComponentIcon } from "./browser";
import { RequestOptions } from "../api/generic";
import { Emitter } from "../pages/_app";

export interface TreeMap {
  [name: string]: FsOsFileInfo[],
}

export interface TreeObject {
  tree?: TreeMap,
  setTree: (val : TreeMap) => any,
  setPwd: (pwd : string) => any,
  path: string,
  options: RequestOptions
  ev: Emitter,
}

export function Tree(props: TreeObject) : ReactElement[] {
  if(props.tree === undefined) return []
  let arr : ReactElement[] = [];

  if(props.tree[props.path] !== undefined)
    props.tree[props.path].forEach((val : FsOsFileInfo, index: number) => {
      if(!IsDirectory(val)) return;

      const localPath = FixPath(props.path+"/"+val.name)

      let fileInfo = (props.tree || {})[localPath] // eslint-disable-line
      let later : ReactElement[] = [];
      if(fileInfo !== undefined) {
        later = later.concat(<div className="ml-1" key={"children:"+localPath+"/"}>{Tree({tree: props.tree, setTree: props.setTree, setPwd: props.setPwd, path: localPath, options: props.options})}</div>)
      }

      arr = arr.concat(
        <div className="my-1" key={localPath+index}>
          <div className="flex items-center text-sm cursor-pointer select-none" onClick={() => {
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


            FsReadDir(props.options, {Name: localPath}).then((v : FsReadDirValue) => {
              obj[localPath] = v.files;

              props.setTree(obj);
            }).catch((e) => {
              props.ev.emit("toast-insert", `ReadDir request failed: ${e}`)
            });
          }} onContextMenu={(e) => {
            e.preventDefault();

            const path = FixPath("/"+localPath)
            props.setPwd(path);
          }}>
            <span></span>
            {FileComponentIcon(IsDirectory(val))}
            <FileComponentFilename {...val} />
          </div>
          {later}
        </div>
      )
    })

  return arr;
}
