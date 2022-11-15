import { ReactElement, useEffect, useState } from "react";

export interface AnimatedComponentProps {
    elem: ReactElement,
    className: string,
    classIn: string,
    classOut: string,
    show: boolean,
    duration: number,
    showRightAway?: boolean
    setShowOutsider?: (val : boolean) => any,
}

export function AnimatedComponent({ elem, className, classIn, classOut, show, duration, setShowOutsider, showRightAway } : AnimatedComponentProps) {
    const [ extraClasses, setExtraClasses ] = useState("");
    const [ ok, setOk ] = useState(showRightAway || false);
    const [ lastShow, setLastShow ] = useState(show);

    useEffect(() => {
        if(show == lastShow) return;

        if(show) {
            setOk(true)
            setExtraClasses(classIn)
            setTimeout(() => setExtraClasses(""), duration)
            if(setShowOutsider) setShowOutsider(false)
        } else if(!show) {
            setOk(true)
            setExtraClasses(classOut)
            setTimeout(() => {
                setOk(false);
                if(setShowOutsider) setShowOutsider(true)
                setExtraClasses("");
            }, duration)
        }

        setLastShow(show)
    }, [show]) // eslint-disable-line

    return ok ? <div className={className+" "+extraClasses}>
        {elem}
    </div> : <div></div>
}
