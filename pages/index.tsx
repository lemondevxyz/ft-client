import Head from 'next/head'
import { useState, useEffect } from 'react';
import { OperationExit, OperationObject, OperationPause, OperationResume, OperationSize, OperationSizeValue } from '../api/operation';
import Link from 'next/link';
import { Dialog, HumanSize, FsItemsDialog, TrimForwardSlashes, FileComponentDate, HumanDate } from './fs';

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
    CurrentValue: number,
    MaxValue: number,
    // extra classes etc...
    Class?: string,
    Size?: number,
}

export function Percentage(p : ProgressBar) : Number {
    return Math.floor((p.CurrentValue / p.MaxValue)*10000)/100;
}

export interface ProgressBarWithText {
    p: ProgressBar
    text: string
}

export function Progress(p : ProgressBar) {
    return <div style={{fontSize: `${p.Size||32}px`, backgroundColor: 'rgba(0, 0, 0, 0.2)'}} className={`relative w-full overflow-hidden flex-1 text-white`}>
        <p style={{fontSize: "0.1em", padding: "0.5em 0em"}}>&nbsp;</p>
        <div className="top-0 left-0 absolute h-full w-full flex items-center font-mono z-10">
            <div className="ml-4" style={{fontSize: '0.1em'}}>{Percentage(p)+"%"}</div>
            <div className="ml-auto mr-4 font" style={{fontSize: '0.05em'}}>
                <p>{HumanSize(p.CurrentValue)}</p>
                <p className="font-bold"><strong>{HumanSize(p.MaxValue)}</strong></p>
            </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full transition transition-300ms" style={{transform: `translateX(${-100+((p.CurrentValue/p.MaxValue)*100)}%)`, backgroundColor: 'rgba(0, 0, 0, 0.1)'}}></div>
    </div>
}


export function SvgImage(str : string) {
    return <svg style={{width: '1em', height: '1em', fill: 'currentColor'}} viewBox="0 0 24 24">
        <path d={str} />
    </svg>
}

export interface OperationOption {
    title: string,
    icon: string,
    click?: () => void,
}

export function Button(val : OperationOption) {
    return <div className="cursor-pointer text-black opacity-75 hover:opacity-100 px-2 py-2 text-4xl" style={{transition: "opacity 300ms ease-in-out"}} title={val.title} aria-label={val.title} onClick={() => val.click && val.click()}>
        {SvgImage(val.icon)}
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
  return <Link href={TrimForwardSlashes("/fs/"+filepath)}>
    <a className="underline" href={`/fs/${filepath}`}>
      {filepath}
    </a>
  </Link>
}

export interface OperationProps extends OperationObject {
    openDialog: () => void
    size: number
    log: string
    started: Date
}

export function OperationComponent(props: OperationProps) {
    const [ showFiles, setShowFiles ] = useState(false);
    const [ showLog, setShowLog ] = useState(false);

    const size = 256
    const pnew = {
        CurrentValue: 505,
        MaxValue: 1052,
        Size: size,
        Class: "w-full",
    }

    const data = {p: {
        CurrentValue: 125,
        MaxValue: 1052,
        Size: size,
        Class: "w-full",
    } as ProgressBar, text: `${props.index}/${props.sources.length}`};

    let src = props.sources[props.index].path;
    let dst = props.destination;

    const pause = () => OperationPause("localhost:8080", { ID: props.id });
    const resume = () => OperationResume("localhost:8080", { ID: props.id });
    const cancel = () => OperationExit("localhost:8080", { ID: props.id });

    return <div className="w-96" style={{backgroundColor: StatusColor(props.status)}}>
        <div className="flex flex-col">
            <div className="flex flex-col justify-center">
                <div className="flex text-xl mx-auto mt-2 mb-4">
                    {Button({title: "Add File(s)", icon: "M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H13.81C13.28 21.09 13 20.05 13 19C13 15.69 15.69 13 19 13C19.34 13 19.67 13.03 20 13.08V8L14 2M13 9V3.5L18.5 9H13M23 20H20V23H18V20H15V18H18V15H20V18H23V20Z", click: () => props.openDialog()})}
                    {Button({title: "Pause", icon: "M14,19H18V5H14M6,19H10V5H6V19Z", click: pause})}
                    {Button({title: "Resume", icon: "M8,5.14V19.14L19,12.14L8,5.14Z", click: resume})}
                    {Button({title: "Cancel", icon: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z", click: cancel})}
                    {Button({title: "Display Files", icon: "M15,7H20.5L15,1.5V7M8,0H16L22,6V18A2,2 0 0,1 20,20H8C6.89,20 6,19.1 6,18V2A2,2 0 0,1 8,0M4,4V22H20V24H4A2,2 0 0,1 2,22V4H4Z", click: () => setShowFiles(!showFiles)})}
                    {Button({title: "Show log", icon: "M17.8,20C17.4,21.2 16.3,22 15,22H5C3.3,22 2,20.7 2,19V18H5L14.2,18C14.6,19.2 15.7,20 17,20H17.8M19,2C20.7,2 22,3.3 22,5V6H20V5C20,4.4 19.6,4 19,4C18.4,4 18,4.4 18,5V18H17C16.4,18 16,17.6 16,17V16H5V5C5,3.3 6.3,2 8,2H19M8,6V8H15V6H8M8,10V12H14V10H8Z", click: () => setShowLog(!showLog) })}
                </div>
                <div className="px-4 mb-4 font-mono overflow-hidden">
                    <div className="overflow-hidden" style={{textOverflow: "ellipsis", wordBreak: "keep-all"}}>
                        <div className="flex items-center">
                            <svg viewBox="0 0 24 24" className="mr-2" style={{width: '1.5em', height: '1.5em', fill: 'currentColor'}}><path d="M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M23 19L20 16V18H16V20H20V22L23 19Z" /></svg>
                            {FileLink(src)}
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
                {(showLog && props.log) || (showFiles && props.sources.map((val) => val.path).join("\n"))}
            </pre></code>}
        </div>
    </div>
}

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
                <td>{v.destination}</td>
                <td>{v.sources.length}</td>
                <td>{HumanDate(v.started)}</td>
                <td>{v.size}</td>
            </tr>
        })}
            </tbody>
        </table>
    })
}

const now = new Date();

export default function Index() {
    const [ dialog, setDialog ] = useState<string[]|undefined>();
    const x : OperationProps = {
        id: "asd",
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
                modTime: new Date().toISOString(),
            },
            {
                name: "ok2",
                size: 1000,
                path: "/media/src/ok2/asdf/asdf/asdf/asdfasfdadsf",
                mode: 755,
                modTime: new Date().toISOString(),
            }
        ],
        openDialog: () => setDialog([]),
        size: -1,
        log: "",
        started: now,
    }

    useEffect(() => {
        OperationSize("localhost:8080", {
            ID: x.id,
        }).then((val : OperationSizeValue) => {
            x.size = val.size
        })
    }, [x]);

    return (
        <div>
            <Head>
                <title>ft - home</title>
                <meta name="description" content="Generated by create next app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <OperationComponent {...x} />
            {FsItemsDialog({ base: "/", dialogFn: (val: string[]) => setDialog(val), show: dialog !== undefined && dialog.length === 0,
                             close: () => setDialog(undefined) })}
        </div>
    )
}
