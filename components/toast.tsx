import { Mutex } from "async-mutex";
import EventEmitter from "events";
import { useEffect, useState } from "react";

export interface ToastProps {
    id: number
    text: string
    ev: EventEmitter
}

export function Toast(val : ToastProps) {
    const [ animate, setAnimate ] = useState("animate-toastIn");

    useEffect(() => {
        if(animate === "animate-toastIn") setTimeout(() => setAnimate(""), 300);

        const fn = (e : string) => {
            if(val.text === e) setAnimate("animate-toastOut");
        }

        val.ev.on("toast-remove", fn);

        return () => { val.ev.off("toast-remove", fn) }
    }, [animate]) // eslint-disable-line

    return <div className={`bg-dark mb-2 rounded-lg shadow text-left p-2 px-4 ${animate}`} key={val.id}
                onClick={ () => val.ev.emit("toast-remove", val.text) }>
        {val.text}
    </div>
}

export interface ToastContainerProps {
    ev: EventEmitter
}

export function ToastContainer({ev} : ToastContainerProps) {
    const [init, setInit] = useState(false);
    const [mtx, _] = useState(new Mutex());
    const [toast, setToast] = useState<string[]>([]);

    useEffect(() => {
        if(init) return;

        setInit(true);

        const arrMtx = new Mutex();
        let arr : string[] = [];

        const toastAdd = (str: string) => {
            mtx.runExclusive(() => {
                if(arr.indexOf(str) !== -1) return;

                arr = arr.concat([str])
                setToast(arr)

                setTimeout(() => ev.emit("toast-remove", str), 5000+((arr.length-1)*2500));
            })
        }

        ev.on("toast-insert", toastAdd);

        const toastRm = (str : string) => {
            setTimeout(() => {
                arrMtx.runExclusive(() => {
                    arr = arr.filter((val : string) : boolean => val !== str);
                    setToast(arr)
                })
            }, 300);
        }

        ev.on("toast-remove", toastRm);
    }, [init]) // eslint-disable-line


    return <>
        {toast.map((text : string, i : number) => {
            return <Toast key={text} {...{text: text, id: i, ev}} />
        })}
    </>
}
