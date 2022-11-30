import { FsOsFileInfo, FsSizeValue, HumanDate, HumanSize, IsDirectory, PromiseFsRemove, PromiseFsSize, PromiseFsVerify } from "../api/fs";
import { useState } from "react";
import { globalHost } from "../pages/_app";
import { useSWRConfig } from "swr";
import { IconTextButton } from "./button";
import EventEmitter from "events";

export const iconFolder = "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z";
export const iconFolderArrow = "M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M23 19L20 16V18H16V20H20V22L23 19Z";
export const iconFile = "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"

interface FileComponentCheckboxProps {
    path: string
    checked?: string[]
    setChecked?: (val : string[]) => any,
}

function FileComponentCheckbox(val : FileComponentCheckboxProps) {
    if(!val.checked || !val.setChecked) return false;

    const checked = val.checked.indexOf(val.path) >= 0

    const onChange = () => {
        if(val.setChecked === undefined || val.checked === undefined) return;

        const index = val.checked.indexOf(val.path);

        val.setChecked(index >= 0 ? val.checked.filter((v) => v != val.path) : val.checked.concat(val.path));
    }

    return <td className="w-6">
        {val.path != ".." && <input type="checkbox" checked={checked} onChange={onChange} />}
    </td>
}

export function FileComponentIcon(dir: boolean) {
    return <svg viewBox="0 0 24 24" style={{minWidth: "1.5em", minHeight: "1.5em", maxWidth: "1.5em", maxHeight: "1.5em", fill: "currentColor"}}><path d={dir ? iconFolder : iconFile} /></svg>
}

interface FileComponentFilenameProps {
    name: string,
    dir: boolean,
    absPath?: string,
    onClick?: (val : string) => any,
    onContextMenu?: (val : string) => any,
}

function FileComponentFilename(val : FileComponentFilenameProps) {
    const showLink = val.absPath && !val.dir
    const onclick = (e : any) => {
        if(showLink) return;

        e.preventDefault();
        if(val.onClick) val.onClick(val!.absPath!)
    }
    const oncontextmenu = (e : any) => {
        e.preventDefault();
        if(val.onContextMenu) val.onContextMenu(val!.absPath!)
    }

    let elem = <p>{val.name}</p>
    if(showLink)
        elem = <a className={`flex items-center w-full select-none cursor-pointer`} rel="noreferrer" target="_blank" href={`http://${globalHost}/files${val.absPath}`}>{elem}</a>

    return <td className={`flex items-center my-2 w-full select-none ${val.dir && "cursor-pointer"}`}
        onClick={ onclick }
        onContextMenu={ oncontextmenu }>
        {FileComponentIcon(val.dir)}
        <span className="ml-2"></span>
        {elem}
    </td>
}

function FileComponentDate(val : FsOsFileInfo) : string {
    const d = new Date();
    d.setTime(Date.parse(val.modTime))

    return HumanDate(d)
}

interface FileComponentSizeProps {
    path: string,
    size: number,
    dir: boolean,
}

function FileComponentSize(val : FileComponentSizeProps) {
    const [size, setSize] = useState(val.size);
    const cfg = useSWRConfig();

    const title = "Size(click to fetch real size for directory)"

    const onClick = () => {
        if(!val.dir) return;

        PromiseFsSize(cfg, {Name: val.path}).then((data : FsSizeValue) =>
            setSize(data.size))
    }

    return <td className={`${val.dir && "cursor-pointer"}`} title={title} aria-label={title} onClick={onClick}>
        {HumanSize(size)}
    </td>
}


export interface FileComponentProps {
    f: FsOsFileInfo,
    showTime?: boolean,
    onClick?: (val : string) => void,
    onContextMenu?: (val : string) => void,
    checked?: string[],
    setChecked?: (val : string[]) => void,
}

export function FileComponent(val: FileComponentProps) {
    const dir = IsDirectory(val.f)
    const elem = FileComponentFilename({
        name: val.f.name,
        dir: dir,
        absPath: val.f.absPath,
        onClick: val.onClick,
        onContextMenu: val.onContextMenu,
    })

    const checkbox : FileComponentCheckboxProps = {
        path: val.f.path,
        checked: val.checked,
        setChecked: val.setChecked
    }

    const sizeProps : FileComponentSizeProps = {
        path: val.f.absPath,
        size: val.f.size,
        dir,
    }

    return <tr className="p-1 font-mono w-full">
        {FileComponentCheckbox(checkbox)}
        {elem}
        <td>{val.showTime && <pre className="ml-auto mr-2">{ FileComponentDate(val.f) }</pre>}</td>
        <FileComponentSize {...sizeProps} />
    </tr>
}

export interface FileActionsProps {
    checked: string[]
    setChecked: (val : string[]) => void
    copy: () => void
    copyPaths: () => void
    ev: EventEmitter
}

export const iconClose = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
const iconMark = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
export const iconFolderAdd = "M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10M15,9V12H12V14H15V17H17V14H20V12H17V9H15Z"
const iconCopy = "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
const iconClipboard = "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
const iconRemove = "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"
const iconVerify = "M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.78L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z";


export function FileActions(val : FileActionsProps) {
    const cfg = useSWRConfig()

    /*
    *   useEffect(() => {
    *       const shouldShow = val.checked.length > 0
    *       if(shouldShow) setUnmount(false);
    *
    *       if(!init) setAnimation(shouldShow ? "animate-popIn" : "animate-popOut")
    *       else setInit(false)
    *   }, [val.checked, animation]); // eslint-disable-line
    */

    const copy = val.copy;
    const copyPaths = val.copyPaths
    const remove = () => {
        val.checked.forEach((v : string) => {
            PromiseFsRemove(cfg, {Name: v});
        })

        val.setChecked([]);
    }
    const verify = () => {
        const src = val.checked[0];
        const dst = val.checked[1];

        val.ev.emit("toast-insert", `sending verification request for ${src} and ${dst}
this could take some time`)

        PromiseFsVerify(cfg, {
            Src: src,
            Dst: dst,
        }).then(() =>
            val.ev.emit("toast-insert", `${src} and ${dst} are the same`))
            .catch(() => val.ev.emit("toast-insert", `${src} isn't identical to ${dst}`))
    }

    return <div className="fixed top-0 left-0 w-full h-auto py-4 md:py-none md:h-16 bg-dark opacity-1 flex items-center text-sm z-50">
        <div className="flex flex-nowrap overflow-x-auto mr-2 items-center">
            <div className="ml-2 mr-1 shrink-0">
                <IconTextButton {...{dark: true, text: "Copy", click: copy, icon: iconCopy}} />
            </div>
            <div className="mr-1 shrink-0">
                <IconTextButton {...{dark: true, text: "Copy Paths", click: copyPaths, icon: iconClipboard}} />
            </div>
            {val.checked.length === 2 &&
             <div className="mr-1 shrink-0">
                 <IconTextButton {...{dark: true, text: "Verify", click: verify, icon: iconVerify}} />
             </div>}
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
