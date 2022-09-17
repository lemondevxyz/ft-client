export interface ProgressBar {
    CurrentValue: number,
    MaxValue: number,
    // extra classes etc...
    Class?: string,
    Size?: number,
}

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

export function Percentage(p : ProgressBar) : Number {
    return Math.floor((p.CurrentValue / p.MaxValue)*10000)/100;
}

export interface ProgressBarWithText {
    p: ProgressBar
    text: string
}

export function Progress(p : ProgressBar) {
    return <div style={{fontSize: `${p.Size||32}px`}} className={`relative bg-green-900 ${p.Class || "w-4em h-1em"} overflow-hidden flex-1 text-white`}>
        <div className="top-0 left-0 absolute h-full w-full flex items-center font-mono" style={{zIndex: "9"}}>
            <div className="ml-2" style={{fontSize: '0.1em'}}>{Percentage(p)+"%"}</div>
            <div className="ml-auto mr-4 font" style={{fontSize: '0.05em'}}>
                <p>{HumanSize(p.CurrentValue)}</p>
                <p className="font-bold"><strong>{HumanSize(p.MaxValue)}</strong></p>
            </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-green-700" style={{transform: `translateX(${-100+((p.CurrentValue/p.MaxValue)*100)}%)`}}></div>
    </div>
}
