import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { FsReadDir, FsOsFileInfo, FixPath, PromiseFsReaddir, FsReadDirValue } from "../api/fs"
import { Browser, BrowserActions, BrowserDirectoryDialog, BrowserNavigators } from "../components/browser"
import { Tree, TreeMap } from '../components/tree';
import getConfig from "next/config"
import { FileActions } from "../components/file"
import { AnimatedComponent } from "../components/animated"
import EventEmitter from "events"
import { OperationNew, OperationObject, OperationSetSources } from "../api/operation"
import { AnimatedOperationSidebar } from "../components/operation"
import { Dialog } from "../components/dialog"
import useSWR, { useSWRConfig } from "swr"
import { ObjectMap } from "./_app"
//import { IconTextButton } from "../components/button"

interface FsTreeProps {
    setPwd : (val : string) => any
    ev: EventEmitter
}

function FsTree({ ev, setPwd } : FsTreeProps) {
    const { data } = FsReadDir({Name: "/"});
    const [ tree, setTree] = useState<TreeMap>({});

    const cfg = useSWRConfig();

    useEffect(() => {
        if(data) {
            let obj = tree
            obj["/"] = data.files

            setTree(obj);
        }
    }, [data]); // eslint-disable-line

    useEffect(() => {
        const callback = (path : string) => {
            const path2 = path.split("/").slice(0, -1).join("/");

            const fn = (path : string) => {return (val : FsReadDirValue) => {
                let copy = JSON.parse(JSON.stringify(tree));
                copy[path] = val.files

                setTree(copy);
            }}

            let designatedPath : string | undefined;
            if(tree[path] !== undefined)
                PromiseFsReaddir(cfg, { Name: path }).then(fn(path)).catch(() => {})
            else if(tree[path2] !== undefined)
                PromiseFsReaddir(cfg, { Name: path2 }).then(fn(path2)).catch(() => {})
        }

        ev.on("fs-update", callback)
        return () => { ev.off("fs-update", callback) }
    })

    return <div className="hidden md:block px-4 pt-2 text-md bg-less-dark min-h-screen text-light-head" style={{minWidth: "300px"}}>
        <h1 className="text-3xl font-bold mb-2">Filesystem tree</h1>
        {Tree({path: "/", setPwd, tree, setTree, ev})}
    </div>
}

interface FsBrowserProps {
    setPwd: (val : string) => any,
    pwd: string,
    checked: string[],
    setChecked: (val : string[]) => any,
    ev: EventEmitter
}

function FsBrowser(val : FsBrowserProps) {
    const base : string = getConfig().publicRuntimeConfig.base || "/";
    const [ files, setFiles ] = useState<FsOsFileInfo[]>([]);
    const [ search, setSearch ] = useState("");

    return <div className="ml-4 md:ml-8 mr-2">
        {BrowserActions(val)}
        <div className="mt-2 w-full flex justify-center flex-wrap sm:flex-nowrap sm:justify-start">
            <div className="shrink flex">{BrowserNavigators(val)}</div>
            <div className="mt-2 w-full sm:w-auto flex justify-center md:justify-end ml-auto shrink-0">
                <input className="h-9 text-se ml-2 mr-2 pl-4 px-2 h-10 border-0 rounded-3xl outline-none focus:bg-yellow-300 bg-gray-200 transition-colors transition-300ms placeholder-dark-disabled text-black" type="text" placeholder="Search" onChange={(e) => setSearch(e.currentTarget.value)} />
            </div>
        </div>
        <div className="min-w-[550px] md:min-w-[750px] mb-24 overflow-hidden">
            {Browser(Object.assign({}, val, {
                setFiles, files, base,
                filter: (val : FsOsFileInfo) =>
                    search.length > 0 ? val.name.includes(search) : true }))}
        </div>
    </div>
}

interface FsViewProps {
    pwd: string,
    setPwd: (val : string) => any,
    checked: string[],
    setChecked: (val : string[]) => any,
    ev: EventEmitter,
}

export function FsView({ ev, pwd, setPwd, checked, setChecked } : FsViewProps) {
    return <>
        {FsTree({ setPwd, ev })}
        {FsBrowser({pwd, setPwd, checked, setChecked, ev})}
    </>
}

interface FsFileActionsProps {
    checked: string[],
    setChecked: (val : string[]) => any,
    setCopyPaths: (val : boolean) => any,
    setDirDialog: (val : string) => any,
    ev: EventEmitter
    pwd: string
    ops: ObjectMap<OperationObject>
    id: string
}

interface FsFileActionsDirDialogProps {
    show: string,
    setShow: (val : string) => any,
    ops: ObjectMap<OperationObject>,
    checked: string[]
    ev: EventEmitter
    id: string
}

function FsFileActionsDirDialog({ checked, show, setShow, ops, ev, id } : FsFileActionsDirDialogProps) {
    const cfg = useSWRConfig();
    const dialogFn = (path: string) => {
        setShow(path);

        const pathSlice = path.split("/");
        const comparefn = (val : string) => pathSlice.includes(val);

        const op : OperationObject | undefined = Object.values(ops).find((val : OperationObject) => {
            const arr = val.dst.split("/")

            // "/home/tim/" becomes ["/home/tim", "/home/tim/"]
            if(arr !== undefined && arr[arr.length-1] === '')
                return arr.slice(0, -1).every(comparefn) || arr.every(comparefn)
            return arr.every(comparefn)
        });

        if(op === undefined) {
            OperationNew(cfg, {
                writer_id: id,
                src: checked,
                dst: path,
            }).then((op : any) => {
                ev.emit("toast-insert", `Created new operation ${(op as {id: string}).id}`)
              })
        } else {
            let paths : ObjectMap<string> = {};
            op.src.forEach((val : FsOsFileInfo) => {
                if(val.path.indexOf("/") > 0) {
                    const arr = val.absPath.split("/")

                    const path = arr.slice(0, arr.indexOf(val.path.split("/")[0])+1).join("/");

                    paths[path] = ""
                } else {
                    paths[val.absPath] = ""
                }
            })

            checked.forEach((val) => paths[val] = "");

            OperationSetSources(cfg, {
                id: op.id,
                srcs: Object.keys(paths),
            })
        }
    }

    return <BrowserDirectoryDialog {...{
        base: "/",
        dialogFn,
        close: () => setShow("null"),
        show: show.length === 0,
    }} />
}

export function FsFileActions({ ops, id, checked, setChecked, ev, pwd } : FsFileActionsProps) {
    const [ showCopy, setShowCopy ] = useState(false);
    const [ dirDialog, setDirDialog ] = useState("null");

    const elem = FileActions({
        checked, setChecked, ev,
        copy: () => setDirDialog(""),
        copyPaths: () => setShowCopy(true),
    })

    const onclick = (e: any) => {
        e.preventDefault();
        e.currentTarget!.focus!();
        e.currentTarget!.setSelectionRange!(0, e!.currentTarget!.value!.length!);
    }

    const pathTextArea = () => <textarea
            className="p-4 h-3/4 w-full resize-none"
            style={{backgroundColor: "rgba(0, 0, 0, 0.2)"}}
            value={checked.join("\n")}
            onClick={onclick}
        ></textarea>

    return <>
        <Dialog {...{
               buttons: [] ,
                title: "Copy Path",
                show: showCopy,
                close: () => setShowCopy(!showCopy),
                child: pathTextArea(),
        }} />
        <FsFileActionsDirDialog {...{
                ops, id, checked, ev, pwd,
                show: dirDialog,
                setShow: setDirDialog}} />
        <AnimatedComponent {...{
            elem,
            className: `fixed top-0 left-0 z-50 bg-dark w-full flex items-center justify-center`,
            classIn: "animate-popIn",
            classOut: "animate-popOut",
            duration: 500,
            show: checked.length > 0 &&
                  dirDialog.length > 0 &&
                  !showCopy,
        }} />
    </>
}

const iconFolderFile = "M15 8C12.79 8 11 9.79 11 12V20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V10.17L20.41 8.59L19.83 8H15M23 14V21C23 22.11 22.11 23 21 23H15C13.9 23 13 22.11 13 21V12C13 10.9 13.9 10 15 10H19L23 14M21 14.83L18.17 12H18V15H21V14.83Z";

export default function Fs({ ev, ops, id } : { ev : EventEmitter, ops : ObjectMap<OperationObject>, id: string }) {
    const [ checked, setChecked ] = useState<string[]>([]);
    const router = useRouter()

    const [ pwd, setPwd ] = useState<string>("/"+(router.query.slug as string[] || []).join("/"))
    const [ showOperations, setShowOperations ] = useState(false);
    const [ showOthers, setShowOthers ] = useState(true);

    const pwdSetter = function(val : string) {
        val = FixPath(val)
        router.replace("", val, {
            scroll: false,
            shallow: true,
        })
        setPwd(val)
    }

    return <div className="relative">
        <Head>
            <title>ft - filebrowser</title>
        </Head>
        <FsFileActions {...{
            pwd, id, ops, setChecked, ev,
            checked: !showOthers ? [] : checked,
            setDirDialog: () => null,
            setCopyPaths: () => null,}} />
        <div className="flex relative">
            <FsView {...{ev, pwd, setPwd: pwdSetter, checked, setChecked}} />
        </div>
        <AnimatedOperationSidebar {...{
            ev, pwdSetter, ops,
            show: showOperations,
            setShow: setShowOperations,
            setShowOutsider: setShowOthers,
        }} />
        <AnimatedComponent {...{
            showRightAway: true,
            show: showOthers,
            className: "fixed bottom-5 right-5 h-16 w-16 bg-dark rounded-full text-2xl",
            duration: 250,
            classIn: "animate-fadeIn",
            classOut: "animate-fadeOut",
            elem: <div className="w-full h-full items-center justify-center flex text-white" onClick={() => setShowOperations(true)}>
                <svg style={{width: '1em', height: '1em', fill: 'currentColor'}}>
                    <path d={iconFolderFile} />
                </svg>
            </div>,
        }} />

    </div>
}
