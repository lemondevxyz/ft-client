import { useRouter } from 'next/router';
import Head from 'next/head'
import { Dispatch, SetStateAction, ReactElement, useEffect, useState } from 'react';
import { FsOsFileInfo, FsReadDir, FsReadDirValue, FsRemove } from '../../api/fs';

import { OperationDialog, OperationDialogProps } from '../index'

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

export function Path(val : string) : string[] {
  return val.split("/");
}

const DirMode = 2147483648

export interface FileProps {
  f: FsOsFileInfo,
  showTime?: boolean,
  onClick?: () => void,
  checked?: FsCheckbox,
  setChecked?: (val : FsCheckbox) => void,
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
  text: string,
  icon?: string,
  click?: () => void,
  dark?: boolean,
}

export function Button(val : ButtonProps) {
  return <button className={`${val.dark ? "bg-dark text-white font-bold hover:bg-less-dark border-2 border-less-dark" : "bg-yellow-100 hover:bg-yellow-300 text-black"} rounded px-6 py-2 flex items-center outline-0 mr-2 transition-colors flex-nowrap`} onClick={() => val.click !== undefined && val.click()}>
  { val.icon &&
    <svg className="mr-1" viewBox="0 0 24 24" style={{width: '1.25em', height: '1.25em', fill: 'currentColor'}}><path d={val.icon} /></svg>
  }
  <span className="break-none">{val.text}</span>
  </button>
}

export function FileComponentIcon(val: FsOsFileInfo) {
  return <svg viewBox="0 0 24 24" style={{minWidth: "1.5em", minHeight: "1.5em", maxWidth: "1.5em", maxHeight: "1.5em"}}><path d={IsDirectory(val) ? "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" : "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"} /></svg>
}

export function FileComponentFilename(val : FsOsFileInfo) {
  return <p className="break-all ml-2">{val.name}</p>
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

export function FileComponentDate(val : FsOsFileInfo) : string {
  const d = new Date();
  d.setTime(Date.parse(val.modTime))

  return HumanDate(d)
}

export function FileComponent(val: FileProps) {
  let checkbox : ReactElement | undefined = undefined;
  if(val.setChecked !== undefined && val.checked !== undefined &&
     val.f.name !== "..") {
    checkbox = <input type="checkbox" checked={val.checked.indexOf(val.f.path) >= 0} onChange={() => {
      if(val.setChecked === undefined || val.checked === undefined) return;
      const index = val.checked.indexOf(val.f.path);
      val.setChecked(index >= 0 ? val.checked.filter((v) => v != val.f.path) : val.checked.concat(val.f.path));}} />
  }

  return <tr className={`p-1 font-mono w-full`}>
    {val.setChecked !== undefined &&
     <td className="w-6">
       {checkbox}
     </td>}
    <td className={`flex items-center my-2 w-full select-none ${IsDirectory(val.f) ? "cursor-pointer" : "cursor-default"}`}
        onClick={ () => val.onClick !== undefined && val.onClick() }>
      <FileComponentIcon {...val.f} />
      <FileComponentFilename {...val.f} />
    </td>
    <td>{val.showTime && <pre className="ml-auto mr-2">{ FileComponentDate(val.f) }</pre>}</td>
    <td>{val.f.size > 0 && HumanSize(val.f.size)}</td>
  </tr>
}

export interface Tree {
  [name: string]: FsOsFileInfo[],
}

export function FsTree(setPwd : (pwd : string) => void, s : Dispatch<SetStateAction<Tree|undefined>>, m : Tree|undefined, path : string) : ReactElement[] {
  if(m === undefined) return []

  let arr : ReactElement[] = [];

  if(m[path] !== undefined)
    m[path].forEach((val : FsOsFileInfo, index: number) => {
      if(!IsDirectory(val)) return;

      const localPath = TrimForwardSlashes(path+"/"+val.name)

      let fileInfo = m[localPath]
      let later : ReactElement[] = [];
      if(fileInfo !== undefined) {
        later = later.concat(<div className="ml-1" key={"children:"+localPath+"/"}>{FsTree(setPwd, s, m, localPath)}</div>)
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
  showParent: boolean,
  checked?: FsCheckbox,
  setChecked?: (arg0: FsCheckbox) => void,
  filter?: (val : FsOsFileInfo) => boolean,
}

export function FsComponent(obj : FsProps) {
  const [ fileInfo, setFileInfo ] = useState<FsOsFileInfo[]>([]);
  const [ oldPwd, setOldPwd ] = useState(obj.pwd);
  const [ allChecked, setAllChecked ] = useState(false);
  const [ ready, setReady ] = useState(false);

  // @ts-ignore:next-line
  useEffect(() => {
    const oldFiles = JSON.stringify(fileInfo === null ? [] : fileInfo);
    FsReadDir("localhost:8080", {
      Name: obj.pwd,
    }).then((val : FsReadDirValue) => {
      if(val.files === undefined) setFileInfo([])
      else setFileInfo(val.files.sort(SortByDirectory));
      setReady(true);
      setOldPwd(obj.pwd);
    }).catch((e) => {
      console.error(e)
      setFileInfo(JSON.parse(oldFiles))
      if(oldPwd != obj.pwd)
        obj.setPwd(oldPwd);
      else
        obj.setPwd("/");
    });
  }, [obj.pwd]); // eslint-disable-line

  useEffect(() => {
    if(obj.checked !== undefined || !ready) return;
    setAllChecked((obj.checked || []).length === fileInfo.length);
  }, [obj.checked, ready]); // eslint-disable-line

  const allCheckedArr : string[] = fileInfo.map((val : FsOsFileInfo) => val.path);

  return <table className="table-fixed w-full">
    <thead className="h-16">
      <tr>
        {obj.setChecked &&
        <td className="w-6">
          <input type="checkbox" checked={allChecked} onChange={() => {
            const arr = !allChecked ? allCheckedArr : [];
            if(obj.setChecked !== undefined) obj.setChecked(arr);
            setAllChecked(!allChecked);
          }} />
        </td>}
        <td><div className="resize-x w-auto h-auto">Name</div></td>
        <td className="w-48">Last Modification</td>
        <td className="w-32">Size</td>
      </tr>
    </thead>
    <tbody>
      {obj.showParent && <FileComponent {...{f: {name: "..", modTime: "", mode: DirMode, size: -1, path: ""}, onClick: () => obj.setPwd(AllButLast(Path(obj.pwd)).join("/") || "/"), setChecked: obj.setChecked}} />}
      {fileInfo !== null && fileInfo !== undefined && fileInfo.filter((x) =>
        obj.filter ? obj.filter(x) : true
      ).map((x : FsOsFileInfo, i : number) => {
        const path = TrimForwardSlashes(obj.pwd+"/"+x.name)

        const val : FileProps = {
          f: x,
          showTime: true,
          onClick: () => IsDirectory(x) && obj.setPwd(path),
          checked: obj.checked,
          setChecked: obj.setChecked
        }
        return <FileComponent key={path+i.toString()} {...val} />;
      })}
    </tbody>
  </table>
}

export interface DialogInterface {
  buttons: ButtonProps[],
  title: string,
  show: boolean,
  close: () => void,
  child: ReactElement,
}

export function Dialog(val : DialogInterface) {
   useEffect(() => {
    if(val.show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [val.show]);

  return <div className={`fixed left-0 top-0 w-screen h-screen flex items-center justify-center z-40 ${!val.show && "hidden"}`}>
    <div className="w-full h-full absolute top-0 left-0" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}} onClick={ () => val.close() }></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-2/3 bg-yellow-200 rounded-xl flex flex-col" style={{maxWidth: "900px", width: "90%"}}>
      <h1 className="text-2xl font-bold text-center my-2 pb-2" style={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)"}}>{val.title}</h1>
      <div className="mx-4 my-2 pb-2 flex-grow overflow-auto" style={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)"}}>
        {val.child}
      </div>
      {val.buttons.length > 0 &&
      <div className="flex items-center justify-end w-full flex-shrink pb-2" style={{minHeight: "3em"}}>
        {val.buttons.map((val : ButtonProps) => Button(val))}
      </div>}
    </div>
  </div>
}

export interface FsDialogProps {
  base: string
  show: boolean
  close: () => void
  fsVal: FsProps
  done: () => void
}

export function FsDialog(val : FsDialogProps) {
  return Dialog({
    title: "Select a directory",
    buttons: [
      {text: "Cancel", icon: "M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z", click: val.close},
      {text: "Confirm", icon: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z", click: val.done},
    ],
    close: val.close,
    child: <FsComponent {...val.fsVal} />,
    show: val.show,
  })
}

export interface FsItemsDialogProps {
  base: string
  dialogFn: (paths: string[]) => any
  show: boolean
  close: () => any
}

export function FsItemsDialog(val : FsItemsDialogProps) {
  const [ pwd, setPwd ] = useState<string>(val.base);
  const [ checked, setChecked ] = useState<string[]>([]);

  const pwdSetter = (pwd : string) => {
    if(pwd.indexOf(val.base) !== -1) setPwd(pwd);
  }

  const fsObj : FsProps = {
    pwd: pwd,
    setPwd: pwdSetter,
    showParent: pwd != val.base,
    checked, setChecked,
  }

  return FsDialog({
    base: val.base,
    show: val.show,
    close: val.close,
    fsVal: fsObj,
    done: () => val.dialogFn(checked),
  })
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

export type FsCheckbox = string[];

const now = new Date();

export default function Fs() {
  const router = useRouter();
  // used by FsComponent
  const base = TrimForwardSlashes("/"+(router.query.slug as string[] || [""]).join("/"));
  const [ pwd, setPwd ] = useState<string>(base);
  const [ search, setSearch ] = useState<string>("");
  const [ checked, setChecked ] = useState<FsCheckbox>([]);
  const [ ready, setReady ]= useState(false);
  // used by FsTree
  const [ treeFileInfo, setTreeFileInfo ] = useState<Tree>();
  // used by FsComponent when selecting pre-existing operations
  const [ showOperations, setShowOperations ] = useState(false);
  const [ opId, setOpId ] = useState("");

  useEffect(() => {
    FsReadDir("localhost:8080", {
      Name: "/",
    }).then((val : FsReadDirValue) => {
      let obj : Tree = {}
      if(treeFileInfo !== undefined) obj = treeFileInfo;

      obj["/"] = val.files;
      setTreeFileInfo(obj)
    })
  });

  useEffect(() => {
    // run once the router has initialized
    if(!router.isReady || ready) return;
    setPwd(TrimForwardSlashes("/"+(router.query.slug as string[] || [""].join("/"))));
    setReady(true);
  }, [router, ready]);

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
    showParent: pwd.length > 1,
    checked: checked,
    setChecked: (obj : FsCheckbox) => {
      setChecked(obj);
    },
    filter: (val : FsOsFileInfo) => search.length === 0 ? true : val.name.includes(search),
  };


  const opDialogProps : OperationDialogProps = {
    show: true,
    done: (v : string) => {
      setShowOperations(false)
      setOpId(v);
    },
    close: () => setShowOperations(false),
    list: [{
        id: "asdadsfasfdsfd",
        owner: "fas",
        destination: "/media/flash/ok",
        index: 0,
        status: 3,
        sources: [
            {
                name: "ok",
                size: 1600,
                path: "/media/src/ok",
                mode: 755,
                modTime: now.toISOString(),
            },
            {
                name: "ok2",
                size: 1000,
                path: "/media/src/ok2/asdf/asdf/asdf/asdfasfdadsf",
                mode: 755,
                modTime: now.toISOString(),
            }
        ],
        openDialog: () => {},
        size: -1,
        log: "",
        started: now,
    }],
  }

  return <div>
    <Head>
      <title>ft - filesystem</title>
    </Head>
    <div className="flex text-dark-head">
      {showOperations && <OperationDialog {...opDialogProps} />}
      {(checked.length > 0 &&
        <div className={`fixed top-0 left-0 w-full h-auto py-4 md:py-none md:h-16 bg-dark animate-fadeIn flex items-center text-sm`}>
          <div className="flex flex-nowrap overflow-x-auto mr-2 items-center">
            <div className="ml-2 mr-1 shrink-0">
              <Button {...{dark: true, text: "Copy", icon: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
                           click: () => {
                             // only for commit
                             return
                             setShowOperations(true);
                           }}} />
            </div>
            <div className="mr-1 shrink-0">
              <Button {...{dark: true, text: "Copy Paths", icon: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}} />
            </div>
            {/*
            <div className="mr-1 shrink-0">
              <Button {...{dark: true, text: "Move", icon: "M14,17H18V14L23,18.5L18,23V20H14V17M13,9H18.5L13,3.5V9M6,2H14L20,8V12.34C19.37,12.12 18.7,12 18,12A6,6 0 0,0 12,18C12,19.54 12.58,20.94 13.53,22H6C4.89,22 4,21.1 4,20V4A2,2 0 0,1 6,2Z"}} />
            </div>
              */}
            <div className="mr-1 shrink-0">
              <Button {...{dark: true, text: "Remove", icon: "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z",
                click: () => {
                  // only for commit
                  return;

                  checked.forEach((v : string) => {
                    FsRemove("localhost:8080", {
                      Name: v
                    })
                  })

                  setChecked([]);
                  setPwd("/");
                  setPwd(pwd);
                }}} />
            </div>
          </div>
          <div className="ml-auto flex">
            <p className="ml-2 text-white mr-3 font-bold text-2xl font-mono">{`${checked.length}`}</p>
            <div className="pl-2 text-white text-3xl flex items-center justify-center mr-2 cursor-pointer border-l border-light-border">
              <svg viewBox="0 0 24 24" style={{fill: 'white', width: '1em', height: '1em'}} onClick={() => setChecked([])}><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
            </div>
          </div>
        </div>) || <div className={`fixed top-0 left-0 w-full h-16 bg-dark animate-fadeOut`}></div>}
      <div className="hidden md:block px-4 pt-2 text-md bg-yellow-200 min-h-screen" style={{minWidth: "300px"}}>
        <h1 className="text-3xl text-black font-bold mb-2">Filesystem tree</h1>
        {FsTree(pwdSetter, setTreeFileInfo, treeFileInfo, "/")}
      </div>
      <div className="ml-8 mr-2 min-w-content md:min-w-[750px] mb-12">
        <div className="my-2 flex justify-end">
          {Button({ text: "Go to Path", icon: "M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M23 19L20 16V18H16V20H20V22L23 19Z", click: goToPath })}
          {Button({ text: "Refresh", icon: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z", click: () => pwdSetter(pwd)})}
          <div className="ml-auto border-l border-dark-border">
            <input className="h-9 ml-2 mr-2 pl-5 px-2 h-10 border-0 rounded-3xl outline-none focus:bg-yellow-100 bg-gray-200 transition-colors transition-300ms placeholder-dark-disabled text-black" type="text" placeholder="Search" onChange={(e) => setSearch(e.currentTarget.value)} />
          </div>
        </div>
        <div className="flex items-center my-2 mb-6">
          <div className="flex-shrink">
            <FsNavigators {...{pwd: pwd, setPwd: pwdSetter}} />
          </div>
        </div>
        <div className="text-md sm:text-lg md:text-xl">
          {ready && <FsComponent {...fs} />}
        </div>
      </div>
    </div>
  </div>
}
