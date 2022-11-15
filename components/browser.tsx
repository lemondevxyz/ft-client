import { ReactElement, useEffect, useState } from "react"
import { useSWRConfig } from "swr"
import { DirMode, FixPath, FsMove, FsOsFileInfo, FsReadDir, FsURL, IsDirectory, PromiseFsMkdir, SortByDirectory } from "../api/fs"
import { IconTextButton } from "./button"
import { Dialog } from "./dialog"
import { FileComponent, FileComponentProps, iconClose, iconFolderAdd, iconFolderArrow } from "./file"

interface BrowserHeaderProps {
    all?: boolean,
    setAll: (val : boolean) => any,
}

function BrowserHeader({ all, setAll } : BrowserHeaderProps) {
    const onChange = () => setAll(!all)

    return <tr>
        {all !== undefined && setAll !== undefined && <td className="w-6">
            <input type="checkbox" checked={all || false} onChange={onChange} />
        </td>}
        <td><div className="resize-x w-auto h-auto">Name</div></td>
        <td className="w-48">Last Modification</td>
        <td className="w-32">Size</td>
      </tr>
}

function BrowserTable(head : ReactElement, body : ReactElement) {
    return <table className="table-fixed w-full">
        <thead className="h-16">{head}</thead>
        <tbody>{body}</tbody>
    </table>
}

interface BrowserBodyProps {
    files : FsOsFileInfo[]
    drawDots?: boolean
    pwd?: string,
    setPwd?: (val : string) => any,
    setRename?: boolean,
    checked?: string[],
    setChecked?: (val : string[]) => any,
    showTime?: boolean,
    filter?: (val : FsOsFileInfo) => boolean,
    sort?: (a : FsOsFileInfo, b : FsOsFileInfo) => number,
}

const parentDirectory : FsOsFileInfo = {
    name: "..",
    path: "..",
    absPath: "..",
    size: 0,
    modTime: "",
    mode: DirMode,
}

function BrowserBodyParentDirectory(val : BrowserBodyProps) {
    const onClick = () =>
        val.setPwd && val.setPwd!("/"+val!.pwd!.split("/").slice(0, -1).join("/"))

    return FileComponent({
        f: parentDirectory,
        onClick,
        checked: val.checked,
        setChecked: val.setChecked,
    })
}

function BrowserBodyFile(val : BrowserBodyProps, file : FsOsFileInfo) {
    const obj : FileComponentProps = {
        f: file,
        onClick: (path: string) => {
            if(val && val.setPwd) val.setPwd(path)
        },
        onContextMenu: (path: string) => {
            if(!val.setRename) return;

            const newName = prompt("Enter the new name")

            if(newName !== null && newName.length !== 0)
                FsMove({
                    Src: path,
                    Dst: newName,
                });
        },
        checked: val.checked,
        setChecked: val.setChecked,
        showTime: val.showTime,
    }

    return <FileComponent {...obj} key={file.path} />
}

function BrowserBody(val : BrowserBodyProps) : ReactElement<any, any> {
    const filter = val.filter || (() => true);
    const sort = val.sort || SortByDirectory;

    return <>
        {val.drawDots && BrowserBodyParentDirectory(val)}
        {val.files.sort(sort).filter(filter).map((file) =>
            BrowserBodyFile(val, file))}
    </>
}

export interface ReadOnlyBrowserProps {
    files: FsOsFileInfo[]
    pwd?: string
    setPwd?: (val : string) => any,
    checked?: string[]
    setChecked?: (val : string[]) => any,
    showTime?: boolean,
    base?: string,
    filter?: (val : FsOsFileInfo) => boolean,
}

export function ReadOnlyBrowser(obj : ReadOnlyBrowserProps) {
    // for BrowserHeader
    const [all, setAll] = useState<boolean>(false);
    const setCheckedAll = (val : boolean) => {
        if(!obj.checked || !obj.setChecked) return

        obj.setChecked(val ? obj.files.map((val) => val.path) : [])
    };

    useEffect(() => {
        if(obj.checked === undefined) return;

        if(obj.checked.length == obj.files.length &&
            obj.checked.length > 0) setAll(true)
        else setAll(false);
    }, [obj.checked]) // eslint:disable-rule

    const header = BrowserHeader({
        all: obj.checked ? all : undefined,
        setAll: setCheckedAll,
    })

    // for BrowserBody
    const [ base, _ ] = useState(obj.base || obj.pwd)
    const body = BrowserBody(Object.assign({}, obj, {
        drawDots: base != obj.pwd,
        onClick: (val : string) => {
            if(obj && obj.setPwd)
                obj.setPwd(val)
        }
    }))

    return BrowserTable(header, body)
}

export interface BrowserProps extends ReadOnlyBrowserProps {
    setFiles: (val : FsOsFileInfo[]) => any,
}

export function Browser(obj : BrowserProps) {
    const { data, isLoading, error } = FsReadDir({ Name: obj.pwd as string });

    useEffect(() => {
        if(isLoading) return

        if(error === undefined) obj.setFiles(data.files);
        if(obj.setChecked) obj!.setChecked!([])
    }, [data, isLoading]); // eslint-disable-line

    return <ReadOnlyBrowser {...obj} />
}

interface BrowserActionsProps {
    pwd: string
    setPwd: (val : string) => any
}

export const iconRefresh = "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z";

export function BrowserActions({ pwd, setPwd } : BrowserActionsProps) {
    const goToPath = function() {
        const path = prompt("Enter the path you want to go to");

        if(path === null || path === "") return;

        setPwd(path);
    }

    const { fetcher } = useSWRConfig();

    const mkdir = function() {
        const path = prompt("Enter the directory you want to create or its path");

        if(path === null || path === "") return;

        fetcher!(FsURL("mkdir"), {
            Name: path.at(0) === "/" ? path : pwd+"/"+path
        })
    }

    return <div className="flex flex-wrap md:flex-nowrap">
        <div className="mt-2 w-full sm:w-1/3 md:w-auto flex justify-center sm:justify-start md:block">
            {IconTextButton({ dark: true, text: "Go to Path", icon: iconFolderArrow, click: goToPath })}
        </div>
        <div className="mt-2 w-full sm:w-1/3 md:w-auto flex justify-center md:block">
            {IconTextButton({ dark: true, text: "Refresh", click: () => setPwd(pwd), icon: iconRefresh})}
        </div>
        <div className="mt-2 w-full sm:w-1/3 md:w-auto flex justify-center sm:justify-end md:block">
            {IconTextButton({ dark: true, text: "Create Directory", click: mkdir, icon: iconFolderAdd})}
        </div>
    </div>

}

export function BrowserNavigators({ pwd, setPwd } : { pwd: string, setPwd: (pwd : string) => void }) {
    return (
        <>
            {["/"].concat(pwd.split("/")).filter((val : string) => val.length > 0).map((val : string, i : number, arr : string[]) =>
                <button className="bg-gray-200 border-2 py-1 px-4 mt-1 mr-1 rounded outline-0" onClick={() => setPwd(FixPath("/"+arr.slice(0, i+1).join("/")))} key={val+i.toString()}>
                    {val}
                </button>)}
        </>
    );
}

export interface BrowserDialogProps {
    base: string
    show: boolean
    close: () => any,
    pwd: string,
    setPwd: (val : string) => any
    done: () => void
    title: string
    filter?: (val : FsOsFileInfo) => boolean
}

const iconMark = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
export function BrowserDialog({ show, setPwd, pwd, base, close, done, title, filter } : BrowserDialogProps) {
    const [ files, setFiles ] = useState<FsOsFileInfo[]>([])

    const cfg = useSWRConfig()
    const goToPath = () => {
        const path = prompt("Enter the path you want to go to")
        if(path === null || path.length === 0)
            return;

        setPwd(path);
    }

    const mkdir = () => {
        const path = prompt("Enter the directory name")

        if(path === null || path.length === 0) return;

        PromiseFsMkdir(cfg, {
            Name: pwd + "/" + path,
        });
    }

    return Dialog({
        buttons: [
            {text: "Cancel", icon: iconClose, click: close},
            {text: "Confirm", icon: iconMark, click: () => { close(); done() }},
        ],
        close: close,
        child: <div>
            <div className="flex text-sm">
                <div className="ml-auto mr-2">
                    <IconTextButton {...{text: "Go to Path", dark: true, icon: iconFolderArrow, click: goToPath}} />
                </div>
                <div>
                    <IconTextButton {...{text: "Create Directory", dark: true, icon: iconFolderAdd, click: mkdir}} />
                </div>
            </div>
            <Browser {...{setPwd, pwd, base, files, setFiles, filter}} />
        </div>,
        show, title,
    })
}

export interface BrowserDirectoryDialogProps {
  base: string
  dialogFn: (path: string) => any,
  show: boolean
  close: () => any
  curPwd?: string
}

export function BrowserDirectoryDialog(val: BrowserDirectoryDialogProps) {
    const [ pwd, setPwd ] = useState<string>(val.curPwd || val.base);
    const pwdSetter = (pwd : string) => {
        if(pwd.indexOf(val.base) !== -1) setPwd(pwd);
    }

    useEffect(() => {
        if(val.show && val.curPwd) pwdSetter(val.curPwd);
    }, [val.show]) // eslint-disable-line

    return BrowserDialog({
        title: "Select a directory",
        base: val.base,
        show: val.show,
        close: () => {
            val.close();
            setPwd(val.base);
        },
        pwd,
        setPwd: pwdSetter,
        filter: ( val : FsOsFileInfo ) : boolean => IsDirectory(val),
        done: () => {
            val.dialogFn(pwd)
            setPwd(val.base);
        },
    })
}
