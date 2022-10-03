import { ReactElement, useState, useEffect } from 'react';
import { ErrDstAlreadyExists, OperationBehaivor, OperationExit, OperationObject, OperationPause, OperationResume, OperationStatus } from '../api/operation';
import { IconButton, IconTextButton } from './button';
import { FsOsFileInfo, HumanSize, IsDirectory } from '../api/fs';
import { FileComponentIcon, iconClose } from './browser';
import { RequestOptions } from '../api/generic';
import { Emitter, Map } from '../pages/_app';

export function StatusColor(val : OperationStatus) : string {
    switch(val) {
            case OperationStatus.Started: return "lightgreen"
            case OperationStatus.Paused: return "yellow"
            case OperationStatus.Finished: return "cyan"
            case OperationStatus.Aborted: return "tomato"
    }

    return "#f1f1f1"
}

export interface ProgressBar {
    currentValue: number,
    maxValue: number,
    // extra classes etc...
    class?: string,
    size?: number,
}

export function Percentage(cur : number, max : number) : Number {
    return Math.floor((cur / max)*10000)/100;
}

export interface ProgressBarWithText {
    p: ProgressBar
    text: string
}

export function Progress(p : ProgressBar) {
    return <div style={{fontSize: `${p.size||32}px`, backgroundColor: 'rgba(0, 0, 0, 0.2)'}} className={`relative w-full overflow-hidden flex-1 text-white`}>
        <p style={{fontSize: "0.1em", padding: "0.5em 0em"}}>&nbsp;</p>
        <div className="top-0 left-0 absolute h-full w-full flex items-center font-mono z-10">
            <div className="ml-4" style={{fontSize: '0.1em'}}>{Percentage(p.currentValue, p.maxValue)+"%"}</div>
            <div className="ml-auto mr-4 font" style={{fontSize: '0.05em'}}>
                <p>{HumanSize(p.currentValue)}</p>
                <p className="font-bold"><strong>{HumanSize(p.maxValue)}</strong></p>
            </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full transition transition-300ms" style={{transform: `translateX(${-100+((p.currentValue/p.maxValue)*100)}%)`, backgroundColor: 'rgba(0, 0, 0, 0.1)'}}></div>
    </div>
}

export function ToPath(arr: string[]) : string { return arr.join("/") }
export function Path(str : string) : string[] { return str.split("/") }
export function Base(str : string) : string[] {
    let arr = Path(str);

    return arr.splice(0, arr.length)
}

export function Dir(str : string) : string {
    let p = Path(str)
    if(p[p.length-1].indexOf(".") !== -1) {
        return ToPath(Base(ToPath(p)))
    }

    return str
}

export function FileLink(setPwd: (val: string) => void, link : string, name : string) {
  return <a className="cursor-pointer underline" onClick={() => setPwd(link)} title={link}>
      {name}
    </a>
}

export interface OperationProps extends OperationObject {
    //openDialog: () => void
    options: RequestOptions
    setPwd: (val : string) => void
    proceed: (val : OperationBehaivor) => any
    setKeepBehaivor: (val : boolean) => any
}

const iconPause = "M14,19H18V5H14M6,19H10V5H6V19Z";
const iconResume = "M8,5.14V19.14L19,12.14L8,5.14Z";
//const iconCancel =
const iconFiles = "M15,7H20.5L15,1.5V7M8,0H16L22,6V18A2,2 0 0,1 20,20H8C6.89,20 6,19.1 6,18V2A2,2 0 0,1 8,0M4,4V22H20V24H4A2,2 0 0,1 2,22V4H4Z";
const iconLog = "M17.8,20C17.4,21.2 16.3,22 15,22H5C3.3,22 2,20.7 2,19V18H5L14.2,18C14.6,19.2 15.7,20 17,20H17.8M19,2C20.7,2 22,3.3 22,5V6H20V5C20,4.4 19.6,4 19,4C18.4,4 18,4.4 18,5V18H17C16.4,18 16,17.6 16,17V16H5V5C5,3.3 6.3,2 8,2H19M8,6V8H15V6H8M8,10V12H14V10H8Z";
const iconSkip = "M16,18H18V6H16M6,18L14.5,12L6,6V18Z";
const iconReplace = "M14,12H19.5L14,6.5V12M8,5H15L21,11V21A2,2 0 0,1 19,23H8C6.89,23 6,22.1 6,21V18H11V20L15,17L11,14V16H6V7A2,2 0 0,1 8,5M13.5,3H4V16H6V18H4A2,2 0 0,1 2,16V3A2,2 0 0,1 4,1H11.5L13.5,3Z";
const iconDefault = "M13 24C9.74 24 6.81 22 5.6 19L2.57 11.37C2.26 10.58 3 9.79 3.81 10.05L4.6 10.31C5.16 10.5 5.62 10.92 5.84 11.47L7.25 15H8V3.25C8 2.56 8.56 2 9.25 2S10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 .56 12.06 0 12.75 0S14 .56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5S21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z"
const iconContinue = "M20 16L14.5 21.5L13.08 20.09L16.17 17H10.5C6.91 17 4 14.09 4 10.5S6.91 4 10.5 4H18V6H10.5C8 6 6 8 6 10.5S8 15 10.5 15H16.17L13.09 11.91L14.5 10.5L20 16Z";

export function OperationBehaivorIcon(o : OperationBehaivor) : string {
    switch(o) {
            case OperationBehaivor.Replace: return iconReplace;
            case OperationBehaivor.Skip: return iconSkip;
            case OperationBehaivor.Default: return iconDefault
            case OperationBehaivor.Continue: return iconContinue
    }
}

function sum(arr : number[]) : number {
    let num = 0;

    arr.forEach((val) => num += val);

    return num
}

export function OperationErrorOverlay(props: OperationProps) {
    const [ animate, setAnimate ] = useState("animate-fadeIn");
    const [ show, setShow ] = useState(false);

    const skip = () => props.proceed(OperationBehaivor.Skip)
    const replace = () => props.proceed(OperationBehaivor.Replace)
    const continueFn = () => props.proceed(OperationBehaivor.Continue)

    useEffect(() => {
        if(props.err === undefined) {

            setAnimate("animate-fadeOut")
            setTimeout(() => {
                setShow(false);
                setAnimate("animate-fadeIn")
            }, 500);
        } else {
            setTimeout(() => { setShow(true) });
        }
    }, [props.err]);

    return !show ? <div></div> : <div className={`w-full h-full bg-yellow-400 top-0 left-0 absolute z-20 p-4 flex flex-col items-center justify-center ${animate}`}>
        <h1 className="text-xl mb-auto"><strong className="text-2xl font-bold">File already exists:</strong><br /> {props.src.length > 0 && props.src[props.index] && props.src[props.index].name}</h1>
        <h2 className="text-left w-full text-xl font-bold">Choose an action</h2>
        <div className="flex flex-wrap w-full overflow-hidden">
            <div className="my-1">
                {IconTextButton({text: "Skip File", click: skip, icon: iconSkip})}
            </div>
            <div className="my-1">
                {IconTextButton({text: "Replace", click: replace, icon: iconReplace})}
            </div>
            <div className="my-1">
                {IconTextButton({text: "Proceed", click: continueFn, icon: iconContinue})}
            </div>
        </div>
        <div className="flex items-center justify-center my-1 text-xl">
            <input type="checkbox" className="w-5 h-5" onChange={(e) => props.setKeepBehaivor(e.currentTarget.checked)} />
            <p className="ml-2">Apply to all files</p>
        </div>
    </div>
}

export function OperationComponent(props: OperationProps) {
    const [ showFiles, setShowFiles ] = useState(false);
    const [ showLog, setShowLog ] = useState(false);
    const size = 256;

    const generateOpProgress = () => {
        const opMaxValue = sum((props.src || []).slice(0, props.index).map((val : FsOsFileInfo) => val.size));
        //console.log(opMaxValue)

        return {
            currentValue: opMaxValue+props.progress,
            maxValue: props.size,
            size: size,
            class: "w-full",
        }
    }

    const generateFileProgress = () => {
        return {
            currentValue: props.progress || 0,
            maxValue: (props.src.length > props.index && props.src[props.index] || {size: 0}).size,
            size: size,
            class: "w-full",
        }
    }

    const [ fileProgress, setFileProgress ] = useState<ProgressBar>(generateFileProgress());
    const [ opProgress, setOpProgress ] = useState<ProgressBar>(generateOpProgress());

    useEffect(() => {
        setFileProgress(generateFileProgress());
        setOpProgress(generateOpProgress());
    }, [props]); // eslint-disable-line

    let src : FsOsFileInfo|undefined;
    if(props.index !== -1 && props.index < props.src.length)
        src = props.src[props.index];

    const pause = () => OperationPause(props.options, { id: props.id });
    const resume = () => OperationResume(props.options, { id: props.id });
    const cancel = () => OperationExit(props.options, { id: props.id });

    return <div className="w-96 shadow-lg mx-auto relative" style={{backgroundColor: StatusColor(props.status)}}>
        <OperationErrorOverlay {...props} />
        <div className="flex flex-col">
            <div className="flex flex-col justify-center">
                <div className="flex text-xl mx-auto mt-2 mb-4">
                    {IconButton({text: "Pause", click: pause, icon: iconPause})}
                    {IconButton({text: "Resume", click: resume, icon: iconResume})}
                    {IconButton({text: "Cancel", click: cancel, icon: iconClose})}
                    {IconButton({text: "Display Files", click: () => setShowFiles(!showFiles), icon: iconFiles})}
                    {IconButton({text: "Show log", click: () => setShowLog(!showLog), icon: iconLog})}
                </div>
                <div className="px-4 mb-4 font-mono overflow-hidden">
                    <div className="overflow-hidden" style={{textOverflow: "ellipsis", wordBreak: "keep-all"}}>
                        <div className="flex items-center">
                            {src ? <>{FileComponentIcon(IsDirectory(src))}&nbsp;{FileLink(props.setPwd, src.absPath, src.path)}</> : "operation hasn't started"}
                        </div>
                    </div>
                    <div className="overflow-hidden" style={{textOverflow: "ellipsis", wordBreak: "keep-all"}}>
                        <div className="flex items-center">
                            {FileComponentIcon(true)}&nbsp;{FileLink(props.setPwd, props.dst, props.dst)}
                        </div>
                    </div>
                </div>
            </div>
            {/* Current File Progress */}
            <div className="m-2">
                <Progress {...fileProgress} />
            </div>
            {/* Total */}
            <div className="mx-2 mb-2">
                <Progress {...opProgress} />
            </div>
            {/* either showLog or showFiles but not both */}
            {(showLog || showFiles) && ((showLog && showFiles) == false) && <code className="h-32 mt-2 mb-4 mx-auto w-11/12 font-monospace text-light-head overflow-y-auto" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}><pre className="p-2">
                {(showLog && props.log) || (showFiles && props.src.map((val : FsOsFileInfo) => val.absPath).join("\n"))}
            </pre></code>}
        </div>
    </div>
}

export interface OperationSidebarProps {
    ops: Map<OperationObject>
    options: RequestOptions
    pwdSetter: (val : string) => any,
    ev: Emitter
    show: boolean
    setShow: (val : boolean) => any
}

export function OperationSidebar(val : OperationSidebarProps) {
    const [ overlayAnim, setOverlayAnim ] = useState("");
    const [ contentAnim, setContentAnim ] = useState("")
    const [ unmount, setUnmount ] = useState<boolean>(false);
    const [ init, setInit ] = useState<boolean>(true)

    useEffect(() => {
        if(init) {
            setInit(false)
        } else {
            setOverlayAnim(val.show ? "animate-fasterLeftFadeIn" : "animate-fasterLeftFadeOut")
            setContentAnim(val.show ? "animate-leftFadeIn" : "animate-leftFadeOut")
        }

        if(val.show) {
            setUnmount(false)
        } else {
            setTimeout(() => setUnmount(true), 1500);
        }
    }, [val.show]); // eslint-disable-line

    return !unmount && <div className={`fixed top-0 right-0 w-screen h-screen flex justify-end`}>
        <div className={`absolute top-0 left-0 w-full h-full opacity-0 translate-x-full ${overlayAnim}`} style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}
             onClick={(e) => e.target === e.currentTarget && val.setShow(false)}></div>
        <div className={`w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 h-full bg-light shadow z-10 translate-x-full opacity-0 ${contentAnim}`}>
            <div className="py-24 w-11/12 mx-auto">
                {Object.values(val.ops).map((op : OperationObject, i : number) : ReactElement|undefined => {
                    const obj : OperationProps = Object.assign({
                        options: val.options,
                        setPwd: val.pwdSetter,
                        proceed: (behaivor : OperationBehaivor) => {
                            op.behaivor = behaivor;
                            val.ev.emit("operation-set", op);
                            val.ev.emit("operation-file-exist-err", { opId: op.id })
                        },
                        setKeepBehaivor: (bool : boolean) => {
                            op.keepBehaivor = bool
                            val.ev.emit("operation-set", op);
                        },
                    }, op)

                    return op !== undefined ? <OperationComponent key={op.id} {...obj} /> : undefined})}
            </div>
        </div>
    </div>
}

/*
export interface OperationDialogProps {
    show: boolean
    done: (v : string) => void
    close: () => void
    list: OperationProps[]
}

export function OperationDialog(val: OperationDialogProps) {
    return Dialog({
        buttons: [],
        show: val.show,
        close: val.close,
        title: "Choose an Operation",
        child: <table className="table-fixed font-mono w-full">
            <thead>
                <tr className="h-12">
                    <td className="w-32">ID</td>
                    <td>Destination</td>
                    <td className="w-32">File count</td>
                    <td className="w-32">Time Added</td>
                    <td className="w-12">Size</td>
                </tr>
            </thead>
            <tbody>
        {val.list.map((v, i) => {
            return <tr className="h-12" key={i} onClick={() => val.done(v.id)} style={{backgroundColor: "rgba(255, 255, 255, 0.15)"}}>
                <td className="ml-2 overflow-hidden" aria-label={v.id} title={v.id}>&nbsp;{(v.id.length > 10 ? v.id.slice(0, 9) + ".." : v.id)}</td>
                <td>{v.dst}</td>
                <td>{v.src.length}</td>
                <td>{HumanDate(v.started)}</td>
                <td>{v.size}</td>
            </tr>
        })}
            </tbody>
        </table>
    })
}
*/
