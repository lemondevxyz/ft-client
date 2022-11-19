import { ReactElement, useState, useEffect } from 'react';
import { ErrDstAlreadyExists, OperationBehaivor, OperationExit, OperationObject, OperationPause, OperationResume, OperationSetIndex, OperationSetRateLimit, OperationStatus } from '../api/operation';
import { IconButton, IconTextButton } from './button';
import { FsOsFileInfo, HumanSize, IsDirectory, kb, mb, gb, tb } from '../api/fs';
import { useSWRConfig } from 'swr';
import EventEmitter from 'events';
import { iconClose, FileComponentIcon } from './file';
import { AnimatedComponent } from './animated';
import { iconMark } from './browser';

export function StatusColor(val : OperationStatus) : string {
    switch(val) {
    case OperationStatus.Started: return "lightgreen"
    case OperationStatus.Paused: return "yellow"
    case OperationStatus.Finished: return "cyan"
    case OperationStatus.Aborted: return "tomato"
    }

    return "#ddd"
}

export interface ProgressBar {
    currentValue: number,
    maxValue: number,
    // extra classes etc...
    class?: string,
    size?: number,
}

export function Percentage(cur : number, max : number) : Number {
    return Math.floor((cur / max)*10000)/100 || 0.00;
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
                <p>{HumanSize(p.currentValue || 0)}</p>
                <p className="font-bold"><strong>{HumanSize(p.maxValue || 0)}</strong></p>
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
    setPwd: (val : string) => void
    proceed: (val : OperationBehaivor) => any
    setKeepBehaivor: (val : boolean) => any
}

//const iconSkip = "M4,5V19L11,12M18,5V19H20V5M11,5V19L18,12"
const iconPause = "M14,19H18V5H14M6,19H10V5H6V19Z";
const iconResume = "M8,5.14V19.14L19,12.14L8,5.14Z";
//const iconCancel =
const iconFiles = "M15,7H20.5L15,1.5V7M8,0H16L22,6V18A2,2 0 0,1 20,20H8C6.89,20 6,19.1 6,18V2A2,2 0 0,1 8,0M4,4V22H20V24H4A2,2 0 0,1 2,22V4H4Z";
const iconLog = "M17.8,20C17.4,21.2 16.3,22 15,22H5C3.3,22 2,20.7 2,19V18H5L14.2,18C14.6,19.2 15.7,20 17,20H17.8M19,2C20.7,2 22,3.3 22,5V6H20V5C20,4.4 19.6,4 19,4C18.4,4 18,4.4 18,5V18H17C16.4,18 16,17.6 16,17V16H5V5C5,3.3 6.3,2 8,2H19M8,6V8H15V6H8M8,10V12H14V10H8Z";
const iconSkip = "M16,18H18V6H16M6,18L14.5,12L6,6V18Z";
const iconReplace = "M14,12H19.5L14,6.5V12M8,5H15L21,11V21A2,2 0 0,1 19,23H8C6.89,23 6,22.1 6,21V18H11V20L15,17L11,14V16H6V7A2,2 0 0,1 8,5M13.5,3H4V16H6V18H4A2,2 0 0,1 2,16V3A2,2 0 0,1 4,1H11.5L13.5,3Z";
const iconDefault = "M13 24C9.74 24 6.81 22 5.6 19L2.57 11.37C2.26 10.58 3 9.79 3.81 10.05L4.6 10.31C5.16 10.5 5.62 10.92 5.84 11.47L7.25 15H8V3.25C8 2.56 8.56 2 9.25 2S10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 .56 12.06 0 12.75 0S14 .56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5S21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z"
const iconContinue = "M20 16L14.5 21.5L13.08 20.09L16.17 17H10.5C6.91 17 4 14.09 4 10.5S6.91 4 10.5 4H18V6H10.5C8 6 6 8 6 10.5S8 15 10.5 15H16.17L13.09 11.91L14.5 10.5L20 16Z";
const iconFileGoTo = "M14 2H6C4.9 2 4 2.9 4 4V20C4 20.41 4.12 20.8 4.34 21.12C4.41 21.23 4.5 21.33 4.59 21.41C4.95 21.78 5.45 22 6 22H13.53C13 21.42 12.61 20.75 12.35 20H6V4H13V9H18V12C18.7 12 19.37 12.12 20 12.34V8L14 2M18 23L23 18.5L20 15.8L18 14V17H14V20H18V23Z";

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

export const iconEdit = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";

export interface OperationErrorOverlayProps extends OperationProps {
    showError: boolean,
    setShowError: (val : boolean) => any
}

export function OperationErrorOverlay(props: OperationErrorOverlayProps) {
    const cfg = useSWRConfig();
    const skip = () => props.proceed(OperationBehaivor.Skip)
    const continueFn = () => props.proceed(OperationBehaivor.Continue)

    const srcAbsPath = (props.src.length > 0 &&
                        props.src[props.index] &&
                        props.src[props.index].absPath) || "";
    
    const dstAbsPath = (props.dst.length > 0 &&
                        props.src[props.index] &&
                        props.dst.split("/").concat(props.src[props.index].path.split("/")).join("/")) || "";
    
    const srcPath : string | boolean = props.src.length > 0 && props.src[props.index] && props.src[props.index].path

    const setPwd = (val : string) => {
        return () => {
            props.setPwd(val);
        }
    }

    const elem = <div className={`p-4 flex flex-col items-center justify-center bg-red-700 text-white z-20 min-h-full h-full`}>
        <h1 className="text-4xl font-mono mb-4"><strong>ERROR</strong></h1>
        <h2 className="w-full text-2xl truncate" aria-label={props.err && props.err.error} title={props.err && props.err.error}>
            <strong className="font-bold">{props.err && props.err.error}</strong><br /></h2>
        <div className="text-left mr-auto" title={srcAbsPath} aria-label={srcAbsPath}>
            <span>source:&nbsp;</span>
            {srcPath && <span>{srcPath}</span>}
        </div>
        <div className="text-left mr-auto">destination: {props.err && props.err.dst}</div>
        <div className="flex flex-wrap w-full overflow-hidden text-sm">
            <div className="my-1">
                {IconTextButton({text: "Modify Operation", click: () => props.setShowError(false), icon: iconEdit, dark: true})}
            </div>
        </div>
    </div>
    
    return <AnimatedComponent
        {...{
            className: "w-full h-full absolute top-0 left-0 z-20",
            classIn: "animate-fadeIn",
            classOut: "animate-fadeOut",
            showRightAway: props.showError,
            elem: elem,
            show: props.showError,
            duration: 200,
        }}
    />
}

const iconRateLimit = "M2 12C2 16.97 6.03 21 11 21C13.39 21 15.68 20.06 17.4 18.4L15.9 16.9C14.63 18.25 12.86 19 11 19C4.76 19 1.64 11.46 6.05 7.05C10.46 2.64 18 5.77 18 12H15L19 16H19.1L23 12H20C20 7.03 15.97 3 11 3C6.03 3 2 7.03 2 12Z"

function OperationRateLimit(props : OperationProps) {
    const cfg = useSWRConfig();
    const [ speed, setSpeed ] = useState(props.rateLimit);
    const [ option, setOption ] = useState(HumanSize(props.rateLimit).split(" ").at(1));
    const [ div, setDiv ] = useState(1);

    const resetOption = (val : number) => HumanSize(val).split(" ").at(1)

    const retDev = (option: string) => {
        switch(option) {
            case "KB": { return kb }
            case "MB": { return mb }
            case "GB": { return gb }
            case "TB": { return tb }
        }

        return 1
    }
    
    useEffect(() => {
        setOption(resetOption(props.rateLimit))
        setDiv(retDev(option))
        setSpeed(props.rateLimit / retDev(resetOption(props.rateLimit)))
    },[props.rateLimit])

    const reset = () => {
        setSpeed(props.rateLimit)
        setOption(resetOption())
    }

    const save = () => {
        OperationSetRateLimit(cfg, {
            id: props.id,
            speed: speed * retDev(option),
        }).then(() => {

            let newOption = resetOption(speed * retDev(option))
            setOption(newOption)
            
            if(retDev > speed) setSpeed(speed / retDev(option))
            else setSpeed(speed)
        })
    }

    const onChangeOption = (e : React.ChangeEvent<HTMLSelectElement>) => {
        setOption(e.currentTarget.value);
    }

    const onChangeInput = (e : React.ChangeEvent<HTMLInputElement>) => {
        setSpeed(parseInt(e.currentTarget.value))
    }
    
    return <div className="mx-auto flex w-full items-center justify-center">
        <input className="w-1/4 m-2 p-2 bg-gray-200 text-black rounded" type="number" value={speed} onChange={onChangeInput} />
        <div className="flex-grow flex items-center justify-center">
            <select className="py-2" value={option} onChange={onChangeOption}>
                <option value="bytes">bytes per second</option>
                <option value="KB">KB/s</option>
                <option value="MB">MB/s</option>
                <option value="GB">GB/s</option>
                <option value="TB">TB/s</option>
            </select>
        </div>
        <div className="mx-2 text-2xl h-full flex h-full items-center justify-center">
            <svg style={{width: '1em', height: '1em'}} aria-label="Set rate limit" viewBox="0 0 24 24" className="mr-2" onClick={() => save()}>
                <path d={iconMark} />
            </svg>
            <svg style={{width: '1em', height: '1em'}} aria-label="Reset rate limit to its default value" fill="currentColor" viewBox="0 0 24 24" onClick={() => reset()}>
                <path d={iconRateLimit} />
            </svg>
        </div>
    </div>

}

export const iconErrorDialog = "M2 19.63L13.43 8.2L12.72 7.5L14.14 6.07L12 3.89C13.2 2.7 15.09 2.7 16.27 3.89L19.87 7.5L18.45 8.91H21.29L22 9.62L18.45 13.21L17.74 12.5V9.62L16.27 11.04L15.56 10.33L4.13 21.76L2 19.63Z"

export function OperationComponent(props: OperationProps) {
    const [ showFiles, setShowFiles ] = useState(false);
    const [ showLog, setShowLog ] = useState(false);
    const [ showError, setShowError ] = useState(props.err !== undefined);

    useEffect(() => {
        setShowError(props.err !== undefined);
    }, [props.err])
    
    const size = 256;
    const cfg = useSWRConfig();

    const index = props.index < 0 ? 0 : props.index
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
            maxValue: (props.src.length > props.index && props.src[index] || {size: 0}).size,
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
    if(index < props.src.length)
        src = props.src[index];

    const pause = () => OperationPause(cfg, { id: props.id });
    const resume = () => OperationResume(cfg, { id: props.id });
    const cancel = () => OperationExit(cfg, { id: props.id });
    const skip = () => {
        OperationSetIndex(cfg, {
            id: props.id,
            index: index+1 })
    }

    return <div className="w-auto max-w-sm shadow-lg mx-auto relative" style={{backgroundColor: StatusColor(props.status)}}>
        <OperationErrorOverlay {...Object.assign({}, props, {showError, setShowError})} />
        <div className="flex flex-col">
            <div className="flex flex-col justify-center">
                <div className="flex text-2xl xs:text-xl sm:text-2xl md:text-3xl mx-auto mt-2 mb-4">
                    {IconButton({text: "Skip", click: skip, icon: iconSkip})}
                    {IconButton({text: "Pause", click: pause, icon: iconPause})}
                    {IconButton({text: "Resume", click: resume, icon: iconResume})}
                    {IconButton({text: "Cancel", click: cancel, icon: iconClose})}
                    {IconButton({text: "Display Files", click: () => setShowFiles(!showFiles), icon: iconFiles})}
                    {IconButton({text: "Show log", click: () => setShowLog(!showLog), icon: iconLog})}
                    {props.err !== undefined && IconButton({text: "View Error Dialog", icon: iconErrorDialog, click: () => setShowError(true) })}
                </div>
                <div className="px-4 mb-4 font-mono overflow-hidden">
                    <div className="overflow-hidden" style={{textOverflow: "ellipsis", wordBreak: "keep-all"}}>
                        <div className="flex items-center">
                            {src ? <>{FileComponentIcon(IsDirectory(src))}&nbsp;{FileLink(props.setPwd, src.absPath, src.path)}</> : "Operation hasn't started"}
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
            <OperationRateLimit {...props} />
            {/* either showLog or showFiles but not both */}
            {(showLog || showFiles) && ((showLog && showFiles) == false) && <code className="h-32 mt-2 mb-4 mx-auto w-11/12 font-monospace text-light-head overflow-y-auto" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}><pre className="p-2">
                {(showLog && props.log) || (showFiles && props.src.map((val : FsOsFileInfo) => val.absPath).join("\n"))}
            </pre></code>}
        </div>
    </div>
}

export interface OperationSidebarProps {
    ops: { [key : string] : OperationObject }
    pwdSetter: (val : string) => any,
    ev: EventEmitter
    show: boolean
    setShow: (val : boolean) => any
}

export function OperationSidebar(val : OperationSidebarProps) {
    return <div className={`fixed top-0 right-0 w-screen h-screen flex justify-end`}>
        <div className={`absolute top-0 left-0 w-full h-full`} style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}
             onClick={(e) => e.target === e.currentTarget && val.setShow(false)}></div>
        <div className={`w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 h-full bg-light shadow z-10 overflow-y-auto`}>
            <div className="py-24 w-11/12 mx-auto">
                {Object.values(val.ops).map((op : OperationObject) : ReactElement|undefined => {
                    const obj : OperationProps = Object.assign({
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

export interface AnimatedOperationSidebarProps extends OperationSidebarProps {
    setShowOutsider: (val : boolean) => any,
}

export function AnimatedOperationSidebar(val : AnimatedOperationSidebarProps) {
    const [ showOutsider, setShowOutsider ] = useState<boolean>();

    useEffect(() => {
        if(showOutsider === undefined) return;
        
        if(!showOutsider) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
    }, [showOutsider])

    const elem = OperationSidebar(val);

    return <AnimatedComponent {...{
        classIn: "sidebar-in",
        classOut: "sidebar-out",
        showRightAway: false,
        setShowOutsider: (b : boolean) => {
            setShowOutsider(b)
            val.setShowOutsider(b)
        },
        className: "relative w-screen h-screen",
        show: val.show,
        duration: 1000,
        elem,
    }} />
}
