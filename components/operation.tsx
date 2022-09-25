import { useState, useEffect } from 'react';
import { OperationExit, OperationObject, OperationPause, OperationResume } from '../api/operation';
import Link from 'next/link';
import { IconButton } from './button';
import { FixPath, FsOsFileInfo, HumanSize, IsDirectory } from '../api/fs';
import { FileComponentIcon, iconClose } from './browser';
import { RequestOptions } from '../api/generic';

enum Status {
    Default,
    Started,
    Paused,
    Finished,
    Aborted,
}

export function StatusColor(val : Status) : string {
    switch(val) {
            case Status.Started: return "lightgreen"
            case Status.Paused: return "yellow"
            case Status.Finished: return "cyan"
            case Status.Aborted: return "tomato"
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

export function FileLink(filepath : string) {
  return <Link href={FixPath("/"+filepath)}>
    <a className="underline" href={`/${filepath}`}>
      {filepath}
    </a>
  </Link>
}

export interface OperationProps extends OperationObject {
    //openDialog: () => void
    options: RequestOptions
}

const iconPause = "M14,19H18V5H14M6,19H10V5H6V19Z";
const iconResume = "M8,5.14V19.14L19,12.14L8,5.14Z";
//const iconCancel =
const iconFiles = "M15,7H20.5L15,1.5V7M8,0H16L22,6V18A2,2 0 0,1 20,20H8C6.89,20 6,19.1 6,18V2A2,2 0 0,1 8,0M4,4V22H20V24H4A2,2 0 0,1 2,22V4H4Z";
const iconLog = "M17.8,20C17.4,21.2 16.3,22 15,22H5C3.3,22 2,20.7 2,19V18H5L14.2,18C14.6,19.2 15.7,20 17,20H17.8M19,2C20.7,2 22,3.3 22,5V6H20V5C20,4.4 19.6,4 19,4C18.4,4 18,4.4 18,5V18H17C16.4,18 16,17.6 16,17V16H5V5C5,3.3 6.3,2 8,2H19M8,6V8H15V6H8M8,10V12H14V10H8Z";

function sum(arr : number[]) : number {
    let num = 0;

    arr.forEach((val) => num += val);

    return num
}

export function OperationComponent(props: OperationProps) {
    const [ showFiles, setShowFiles ] = useState(false);
    const [ showLog, setShowLog ] = useState(false);
    const [ opMaxValue, _ ] = useState(sum(props.src.map((val : FsOsFileInfo) => val.size)));

    const size = 256
    const pnew = {
        currentValue: 505,
        maxValue: 1052,
        size: size,
        class: "w-full",
    }
    const data = {p: {
        currentValue: 0,
        maxValue: opMaxValue,
        size: size,
        class: "w-full",
    } as ProgressBar, text: `${props.index}/${props.src.length}`};

    let src : FsOsFileInfo|undefined;
    if(props.index !== -1 && props.index < props.src.length)
        src = props.src[props.index];

    let dst = props.dst;

    const pause = () => OperationPause(props.options, { id: props.id });
    const resume = () => OperationResume(props.options, { id: props.id });
    const cancel = () => OperationExit(props.options, { id: props.id });

    return <div className="w-96 shadow-lg mx-auto" style={{backgroundColor: StatusColor(props.status)}}>
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
                            {src ? <>{FileComponentIcon(IsDirectory(src))}{FileLink(src.path)}</> : "operation hasn't started"}
                        </div>
                    </div>
                    <div className="overflow-hidden" style={{textOverflow: "ellipsis", wordBreak: "keep-all"}}>
                        <div className="flex items-center">
                            <svg viewBox="0 0 24 24" className="mr-2" style={{width: '1.5em', height: '1.5em', fill: 'currentColor'}}><path d="M22,4H14L12,2H6A2,2 0 0,0 4,4V16A2,2 0 0,0 6,18H22A2,2 0 0,0 24,16V6A2,2 0 0,0 22,4M2,6H0V11H0V20A2,2 0 0,0 2,22H20V20H2V6Z" /></svg>
                            {FileLink(dst)}
                        </div>
                    </div>
                </div>
            </div>
            {/* Current File Progress */}
            <div className="m-2">
                <Progress {...pnew} />
            </div>
            {/* Total */}
            <div className="mx-2 mb-2">
                <Progress {...data.p} />
            </div>
            {/* either showLog or showFiles but not both */}
            {(showLog || showFiles) && ((showLog && showFiles) == false) && <code className="h-32 mt-2 mb-4 mx-auto w-11/12 font-monospace text-light-head overflow-y-auto" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}><pre className="p-2">
                {(showLog && props.log) || (showFiles && props.src.map((val : FsOsFileInfo) => val.path).join("\n"))}
            </pre></code>}
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
