import EventEmitter from 'events';
import { useEffect, useState, ReactElement } from 'react';
import { FsReadDir, FsReadDirValue, FsOsFileInfo, IsDirectory, HumanDate, HumanSize, SortByDirectory, DirMode, FixPath, FsRemove } from '../api/fs'
import { RequestOptions } from '../api/generic';
import { IconTextButton } from './button';
import { Dialog } from './dialog';

export interface FileProps {
  f: FsOsFileInfo,
  showTime?: boolean,
  onClick?: () => void,
  checked?: string[],
  setChecked?: (val : string[]) => void,
}

const iconFolder = "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z";

const iconFile = "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"

export function FileComponentIcon(dir: boolean) {
    return <svg viewBox="0 0 24 24" style={{minWidth: "1.5em", minHeight: "1.5em", maxWidth: "1.5em", maxHeight: "1.5em", fill: "currentColor"}}><path d={dir ? iconFolder : iconFile} /></svg>
}

export function FileComponentFilename(val : FsOsFileInfo) {
  return <p className="break-all ml-2">{val.name}</p>
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
      {FileComponentIcon(IsDirectory(val.f))}
      <FileComponentFilename {...val.f} />
    </td>
    <td>{val.showTime && <pre className="ml-auto mr-2">{ FileComponentDate(val.f) }</pre>}</td>
    <td>{val.f.size > 0 && HumanSize(val.f.size)}</td>
  </tr>
}

export interface BrowserProps {
  pwd: string,
  setPwd: (val : string) => void,
  showParent: boolean,
  options: RequestOptions
  checked?: string[],
  setChecked?: (arg0: string[]) => void,
  filter?: (val : FsOsFileInfo) => boolean,
  ev?: EventEmitter,
}

export function Browser(obj : BrowserProps) {
  const [ fileInfo, setFileInfo ] = useState<FsOsFileInfo[]>([]);
  const [ oldPwd, setOldPwd ] = useState(obj.pwd);
  const [ allChecked, setAllChecked ] = useState(false);
  const [ ready, setReady ] = useState(false);
  const [ refresh, setRefresh ] = useState(0);

  // @ts-ignore:next-line
  useEffect(() => {
    const oldFiles = JSON.stringify(fileInfo === null ? [] : fileInfo);
    FsReadDir(obj.options, {
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
  }, [obj.pwd, refresh]); // eslint-disable-line

  useEffect(() => {
    if(!ready) return;
    const updateFn = (e : string) => {
      const a1 : string[] = obj.pwd.split("/")
      const a2 : string[] = e.split("/")
      const a3 : string[] = a2.slice(0, -1);

      const baseEqual : boolean = a2.every((val) => a1.includes(val));
      const arrayEqual : boolean = a3.every((val) => a1.includes(val));

      //console.log(e, obj.pwd, a1, a2);
      if(e == obj.pwd || baseEqual || arrayEqual) setRefresh(refresh+1);
    }

    if(obj !== undefined && obj.ev !== undefined)
        obj.ev.addListener("fs-update", updateFn);

    return () => {
      if(obj !== undefined && obj.ev !== undefined)
          obj.ev.removeListener("fs-update", updateFn);
    }
  }, [ready, refresh]); // eslint-disable-line

  useEffect(() => {
    if(obj.checked !== undefined || !ready) return;
    setAllChecked((obj.checked || []).length === fileInfo.length);
  }, [obj.checked, ready]); // eslint-disable-line

  const allCheckedArr : string[] = fileInfo.map((val : FsOsFileInfo) => val.path);

  return <table className="table-fixed w-[750px] md:w-full">
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
      {obj.showParent && <FileComponent {...{f: {name: "..", modTime: "", mode: DirMode, size: -1, path: ""}, onClick: () => obj.setPwd(obj.pwd.split("/").slice(0, -1).join("/") || "/"), setChecked: obj.setChecked}} />}
      {fileInfo !== null && fileInfo !== undefined && fileInfo.filter((x) =>
        obj.filter ? obj.filter(x) : true
      ).map((x : FsOsFileInfo, i : number) => {
        const path = FixPath(obj.pwd+"/"+x.name)

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

export interface BrowserDialogProps {
  base: string
  show: boolean
  close: () => void
  fsVal: BrowserProps
  done: () => void
  title: string
}

export const iconClose = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
const iconMark = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

export function BrowserDialog(val : BrowserDialogProps) {
  return Dialog({
    buttons: [
      {text: "Cancel", icon: iconClose, click: val.close},
      {text: "Confirm", icon: iconMark, click: () => { val.close(); val.done() }},
    ],
    close: val.close,
    child: <Browser {...val.fsVal} />,
    show: val.show,
    title: val.title,
  })
}

export interface BrowserDirectoryDialogProps {
  base: string
  dialogFn: (path: string) => any,
  show: boolean
  close: () => any
  options: RequestOptions
}

export function BrowserDirectoryDialog(val: BrowserDirectoryDialogProps) {
  const [ pwd, setPwd ] = useState<string>(val.base);
  const pwdSetter = (pwd : string) => {
    if(pwd.indexOf(val.base) !== -1) setPwd(pwd);
  }

  const fsObj : BrowserProps = {
    pwd: pwd,
    setPwd: pwdSetter,
    showParent: pwd != val.base,
    filter: (val : FsOsFileInfo) : boolean => IsDirectory(val),
    options: val.options,
  }

  return BrowserDialog({
    title: "Select a directory",
    base: val.base,
    show: val.show,
    close: () => {
      val.close();
      setPwd(val.base);
    },
    fsVal: fsObj,
    done: () => {
      val.dialogFn(pwd)
      setPwd(val.base);
    },
  })
}

export interface BrowserItemsDialogProps {
  base: string
  dialogFn: (paths: string[]) => any
  show: boolean
  close: () => any
  options: RequestOptions
}

export function BrowserItemsDialog(val : BrowserItemsDialogProps) {
  const [ pwd, setPwd ] = useState<string>(val.base);
  const [ checked, setChecked ] = useState<string[]>([]);

  const pwdSetter = (pwd : string) => {
    if(pwd.indexOf(val.base) !== -1) setPwd(pwd);
  }

  const fsObj : BrowserProps = {
    pwd: pwd,
    setPwd: pwdSetter,
    showParent: pwd != val.base,
    checked, setChecked,
    options: val.options
  }

  return BrowserDialog({
    title: "Select files",
    base: val.base,
    show: val.show,
    close: val.close,
    fsVal: fsObj,
    done: () => val.dialogFn(checked),
  })
}

export interface FileActionsProps {
  checked: string[]
  setChecked: (val : string[]) => void
  copy: () => void
  options: RequestOptions
}

const iconCopy = "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"

const iconClipboard = "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"

const iconRemove = "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"

export function FileActions(val : FileActionsProps) {
    const copy = val.copy;
    const copyPaths = () => {
        var input = document.createElement('textarea');
        input.setAttribute('value', val.checked.join("\n"));
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        val.setChecked([]);
    }
    const remove = () => {
        val.checked.forEach((v : string) => {
            FsRemove(val.options, {
                Name: v
            })
        })

        val.setChecked([]);
    }

    return <div className={`fixed top-0 left-0 w-full h-auto py-4 md:py-none md:h-16 bg-dark animate-fadeIn flex items-center text-sm`}>
        <div className="flex flex-nowrap overflow-x-auto mr-2 items-center">
            <div className="ml-2 mr-1 shrink-0">
                <IconTextButton {...{dark: true, text: "Copy", click: copy, icon: iconCopy}} />
            </div>
            <div className="mr-1 shrink-0">
                <IconTextButton {...{dark: true, text: "Copy Paths", click: copyPaths, icon: iconClipboard}} />
            </div>
            <div className="mr-1 shrink-0">
                <IconTextButton {...{dark: true, text: "Remove", click: remove, icon: iconRemove}} />
            </div>
        </div>
        <div className="ml-auto flex">
            <p className="ml-2 text-white mr-3 font-bold text-2xl font-mono">{`${val.checked.length}`}</p>
            <div className="pl-2 text-white text-3xl flex items-center justify-center mr-2 cursor-pointer border-l border-light-border">
                <svg viewBox="0 0 24 24" style={{fill: 'white', width: '1em', height: '1em'}} onClick={() => val.setChecked([])}><path d={iconClose} /></svg>
            </div>
        </div>
    </div>
}