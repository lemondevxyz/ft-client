import { FileComponent, FileProps } from './file';
import { Progress, ProgressBar } from './progress';
import { OperationObject } from '../api/operation'
import Link from 'next/link';

export function SvgImage(str : string) {
    return <svg style={{width: '1em', height: '1em', fill: 'currentColor'}} viewBox="0 0 24 24">
        <path d={str} />
    </svg>
}

export interface OperationOption {
    Title: string,
    Icon: string,
    Click?: string,
}

export function Option(val : OperationOption) {
    const icon = val.Icon;
    return <div className="cursor-pointer text-black opacity-75 hover:opacity-100 px-2 py-2 text-4xl" style={{transition: "opacity 300ms ease-in-out"}} title={val.Title} aria-label={val.Title}>
        {SvgImage(icon)}
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
    return <Link href={`/fs/${filepath}`}>
        <a className="underline" href={`/fs/${filepath}`}>
            {filepath}
        </a>
    </Link>
}

export function OperationComponent(props: OperationObject) {
    const pnew = {
        CurrentValue: 505,
        MaxValue: 1052,
        Size: 256,
        Class: "w-full min-h-1em",
    }

    const data = {p: {
            CurrentValue: 125,
            MaxValue: 1052,
            Size: 256,
            Class: "w-full min-h-1em",
    } as ProgressBar, text: `${props.Index}/${props.Sources.length}`};

    let src = props.Sources[props.Index].Path;
    let dst = props.Destination;

    return <div className="w-full bg-yellow-300">
        <div className="flex flex-col">
            <div className="bg-yellow-300 flex flex-col justify-center">
                <div className="flex text-xl mx-auto mt-2 mb-4">
                    {Option({Title: "Add File(s)", Icon: "M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H13.81C13.28 21.09 13 20.05 13 19C13 15.69 15.69 13 19 13C19.34 13 19.67 13.03 20 13.08V8L14 2M13 9V3.5L18.5 9H13M23 20H20V23H18V20H15V18H18V15H20V18H23V20Z"})}
                    {Option({Title: "Pause", Icon: "M14,19H18V5H14M6,19H10V5H6V19Z"})}
                    {Option({Title: "Resume", Icon: "M8,5.14V19.14L19,12.14L8,5.14Z"})}
                    {Option({Title: "Cancel", Icon: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"})}
                    {Option({Title: "Information", Icon: "M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"})}
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
        </div>
    </div>
}
