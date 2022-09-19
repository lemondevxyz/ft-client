import { useRouter } from 'next/router';
import Head from 'next/head'
import Link from 'next/link'
import { Dispatch, SetStateAction, ReactElement, useEffect, useState } from 'react';
import { FsOsFileInfo, FsReadDir, FsReadDirValue } from '../../api/fs';
import { Path } from '../../components/operation';
import { HumanSize } from '../../components/progress';

const DirMode = 2147483648

export interface FileProps {
  f: FsOsFileInfo,
  showTime?: boolean,
  onClick?: () => void,
  checked?: FsCheckbox,
  setChecked?: (name : string, val : boolean) => void,
}

export function TrimForwardSlashes(str : string) : string {
  return "/"+(str.split("/").filter((v : string) => v.length > 0).join("/"));
}

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

export interface ButtonProps {
  Text: string
  Icon?: string
  Click?: () => void
}

export function Button(val : ButtonProps) {
  return <button className="bg-yellow-100 hover:bg-yellow-300 rounded px-5 py-1 flex items-center outline-0 mr-2" style={{transition: "background 300ms ease-in-out"}} onClick={() => val.Click !== undefined && val.Click()}>
  { val.Icon &&
    <svg className="mr-1" viewBox="0 0 24 24" style={{width: '1.5em', height: '1.5em'}}><path d={val.Icon} /></svg>
  }
  <span>{val.Text}</span>
  </button>
}

export function FileComponentIcon(val: FsOsFileInfo) {
  return <svg viewBox="0 0 24 24" style={{minWidth: "1.5em", minHeight: "1.5em", maxWidth: "1.5em", maxHeight: "1.5em"}}><path d={IsDirectory(val) ? "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" : "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"} /></svg>
}

export function FileComponentFilename(val : FsOsFileInfo) {
  return <p className="break-all ml-2">{val.name}</p>
}

export function FileComponentDate(val : FsOsFileInfo) : string {
  const d = new Date();
  d.setTime(Date.parse(val.modTime))

  return val.modTime !== undefined && val.modTime.length !== 0 ? (d.toISOString().slice(0, 10) + " " + d.toISOString().slice(11, 19)) : ""
}

export function FileComponent(val: FileProps) {
  if(val.checked !== undefined)
    useEffect(() => {}, [val.checked]);

  return <tr className={`p-1 font-mono w-full`}>
     <td className="w-8">
       {val.setChecked && val.checked &&
        <input className="cursor-pointer" type="checkbox" checked={val.checked[val.f.path]}
               onChange={ (e) => {
                 val.setChecked(val.f.path, !(val.checked[val.f.path] || false));
               }} />}
     </td>
    <td className={`flex items-center my-2 w-full select-none ${IsDirectory(val.f) ? "cursor-pointer" : "cursor-default"}`}
        onClick={ () => val.onClick !== undefined && val.onClick() }>
      <FileComponentIcon {...val.f} />
      <FileComponentFilename {...val.f} />
    </td>
    <td>{val.showTime && <p className="ml-auto mr-2">{ FileComponentDate(val.f) }</p>}</td>
    <td>{val.f.size > 0 && HumanSize(val.f.size)}</td>
  </tr>
}

export interface Tree {
  [name: string]: FsOsFileInfo[],
}

export function RenderTree(setPwd : (pwd : string) => void, s : Dispatch<SetStateAction<Tree|undefined>>, m : Tree|undefined, path : string) : ReactElement[] {
  if(m === undefined) return []

  let arr : ReactElement[] = [];

  if(m[path] !== undefined)
    m[path].forEach((val : FsOsFileInfo, index: number) => {
      if(!IsDirectory(val)) return;

      const localPath = TrimForwardSlashes(path+"/"+val.name)

      let fileInfo = m[localPath]
      let later : ReactElement[] = [];
      if(fileInfo !== undefined) {
        later = later.concat(<div className="ml-1" key={"children:"+localPath+"/"}>{RenderTree(setPwd, s, m, localPath)}</div>)
      }

      arr = arr.concat(
        <div className="my-1" key={localPath+index}>
          <div className="flex items-center text-sm cursor-pointer select-none" onClick={() => {
            let obj = Object.assign({}, m);
            let paths : string[] = [];
            if(obj[localPath] !== undefined) {
              Object.keys(obj).forEach((v : string) => {
                if(v.includes(localPath)) paths.push(v);
              });
              paths.forEach((val : string) => delete obj[val]);

              s(obj)
              return;
            }

            FsReadDir("localhost:8080", {Name: localPath}).then((v : FsReadDirValue) => {
              obj[localPath] = v.files;

              s(obj);
            })
          }} onContextMenu={(e) => {
            e.preventDefault();

            const path = TrimForwardSlashes("/"+localPath)
            setPwd(path);
          }}>
            <span></span>
            <FileComponentIcon {...val} />
            <FileComponentFilename {...val} />
          </div>
          {later}
        </div>
      )
    })

  return arr;
}

export function AllButLast(fs: Array<any>) : Array<any> {
  if(fs.length == 0) return fs
  return fs.slice(0, fs.length-1)
}

export interface FsProps {
  pwd: string,
  setPwd: (val : string) => void,
  search: string,
  showParent: boolean,
  checked?: FsCheckbox,
  setChecked?: (path : string, val : boolean) => void,
}

export function FsComponent({pwd, setPwd, search, showParent, checked, setChecked} : FsProps) {
  const [ fileInfo, setFileInfo ] = useState<FsOsFileInfo[]>([]);
  const [ oldPwd, setOldPwd ] = useState(pwd);
  const [ allChecked, setAllChecked ] = useState(false);

  useEffect(() => {
    const oldFiles = JSON.stringify(fileInfo === null ? [] : fileInfo);
    FsReadDir("localhost:8080", {
      Name: pwd,
    }).then((val : FsReadDirValue) => {
      if(val.files === undefined) setFileInfo([])
      else setFileInfo(val.files.sort(SortByDirectory));
      setOldPwd(pwd);
    }).catch((e) => {
      setFileInfo(JSON.parse(oldFiles))
      if(oldPwd != pwd)
        setPwd(oldPwd);
      else
        setPwd("/");
    });
  }, [pwd]);


  useEffect(() => {
    if(checked) setAllChecked(!(Object.values(checked).filter((v) => !v).length === 0));
  }, [checked]);

  return <table className="table-fixed w-full">
    <thead className="h-16">
      <tr>
        {setChecked && checked &&
        <td className="w-8">
          <input type="checkbox" checked={allChecked} onChange={(e) =>
            fileInfo.forEach((val: FsOsFileInfo) => setChecked(val.path, !allChecked))} />
        </td>}
        <td>Name</td>
        <td className="w-64">Last Modification</td>
        <td className="w-32">Size</td>
      </tr>
    </thead>
    <tbody>
      {showParent && <FileComponent {...{f: {name: "..", modTime: "", mode: DirMode, size: -1, path: ""}, onClick: () => setPwd(AllButLast(Path(pwd)).join("/") || "/")}} />}
      {fileInfo !== null && fileInfo !== undefined && fileInfo.filter((x) =>
        search.length > 0 ? x.name.includes(search) : true
      ).map((x : FsOsFileInfo, i : number) => {
        const path = TrimForwardSlashes(pwd+"/"+x.name)
        const obj : FileProps = {
          f: x,
          showTime: true,
          onClick: () => IsDirectory(x) && setPwd(path),
          checked, setChecked
        }
        return <FileComponent key={path+i.toString()} {...obj} />;
      })}
    </tbody>
  </table>
}

export function FsDirectoryDialog({ base, dialogFn } : { base : string, dialogFn: (val: string) => void }) {
  const [ pwd, setPwd ] = useState<string>(base);

  const pwdSetter = (pwd : string) => {
    if(pwd.indexOf(base) !== -1) setPwd(pwd);
  }

  const fsObj : FsProps = {
    pwd: pwd,
    setPwd: pwdSetter,
    search: "",
    showParent: pwd != base,
  }

  return <div className="fixed left-0 top-0 w-screen h-screen flex items-center justify-center">
    <div className="w-full h-full absolute top-0 left-0" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-2/3 bg-yellow-200 rounded-xl flex flex-col" style={{maxWidth: "900px", width: "90%"}}>
      <h1 className="text-2xl font-bold text-center my-2 pb-2" style={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)"}}>Select a directory</h1>
      <div className="mx-4 my-2 pb-2 flex-grow overflow-auto" style={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)"}}>
        <FsComponent {...fsObj} />
      </div>
      <div className="flex items-center justify-end w-full flex-shrink pb-2" style={{minHeight: "2em"}}>
        {Button({Text: "Cancel", Icon: "M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z"})}
        {Button({Text: "Select Directory", Icon: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z", Click: () => dialogFn(pwd)})}
      </div>
    </div>
  </div>
}

export function FsNavigators({ pwd, setPwd } : { pwd: string, setPwd: (pwd : string) => void }) {
  return (
    <>
      {["/"].concat(Path(pwd)).filter((val : string) => val.length > 0).map((val : string, i : number, arr : string[]) =>
        <button className="bg-gray-200 border-2 py-1 px-4 mr-1 rounded outline-0" onClick={() => setPwd(TrimForwardSlashes("/"+arr.slice(0, i+1).join("/")))} key={val+i.toString()}>
          {val}
        </button>)}
    </>
  );
}

export interface FsCheckbox {
  [path: string]: boolean
}

export default function Fs() {
  const router = useRouter();
  const [ pwd, setPwd ] = useState<string>("/");
  const [ search, setSearch ] = useState<string>("");
  const [ treeFileInfo, setTreeFileInfo ] = useState<Tree>();
  const [ checked, setChecked ] = useState<FsCheckbox>({});

  useEffect(() => {
    FsReadDir("localhost:8080", {
      Name: "/",
    }).then((val : FsReadDirValue) => {
      let obj : Tree = {}
      if(treeFileInfo !== undefined) obj = treeFileInfo;

      obj["/"] = val.files;
      setTreeFileInfo(obj)
    })
  }, []);

  const pwdSetter = (pwd : string) => {
    let path = pwd.replace("/", "/fs/");
    if(pwd === "/") path = "/fs";

    router.push(path, path, { shallow: true });
    setPwd(pwd);
  }

  const goToPath = function() {
    let a = prompt("");
    if(a && a.length > 0) pwdSetter(a);
  }

  const fs : FsProps = {
    pwd: pwd,
    setPwd: pwdSetter,
    search: search,
    showParent: pwd.length > 1,
    checked: checked,
    setChecked: (path : string, val : boolean) => {
      let obj = checked;
      obj[path] = val;

      setChecked(obj);
    },
  };

  return <div>
    <Head>
      <title>ft - filesystem</title>
    </Head>
    <div className="flex">
      <div className="hidden md:block px-4 pt-2 text-md bg-yellow-200 min-h-screen" style={{minWidth: "300px"}}>
        <h1 className="text-3xl text-black font-bold mb-2">Filesystem tree</h1>
        {RenderTree(pwdSetter, setTreeFileInfo, treeFileInfo, "/")}
      </div>
      <div className="ml-8 mr-2">
        <div className="my-2 flex justify-end">
          {Button({ Text: "Go to Path", Icon: "M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M23 19L20 16V18H16V20H20V22L23 19Z", Click: goToPath })}
          {Button({ Text: "Refresh", Icon: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z", Click: () => pwdSetter(pwd)})}
          <div className="ml-auto border-l-2" style={{borderColor: "rgba(0, 0, 0, 0.12)"}}>
            <input className="h-9 ml-2 mr-2 pl-5 px-2 h-10 border-0 rounded-3xl outline-none bg-gray-200 text-black" type="text" placeholder="Search" onChange={(e) => setSearch(e.currentTarget.value)} />
          </div>
        </div>
        <div className="flex items-center my-2 mb-6">
          <div className="flex-shrink ml-2">
            <FsNavigators {...{pwd: pwd, setPwd: pwdSetter}} />
          </div>
        </div>
        <div className="text-xl">
          <FsComponent {...fs} />
        </div>
      </div>
    </div>
  </div>
}
