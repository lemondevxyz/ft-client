import { useEffect, ReactElement } from "react";
import { IconTextButton, ButtonProps } from "./button";

export interface DialogInterface {
  buttons: ButtonProps[],
  title: string,
  show: boolean,
  close: () => void,
  child: ReactElement,
}

export function Dialog(val : DialogInterface) {
   useEffect(() => {
    if(val.show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [val.show]);

  return <div className={`fixed left-0 top-0 w-screen h-screen flex items-center justify-center z-40 ${!val.show && "hidden"}`}>
    <div className="w-full h-full absolute top-0 left-0" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}} onClick={ () => val.close() }></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-2/3 bg-yellow-200 rounded-xl flex flex-col" style={{maxWidth: "900px", width: "90%"}}>
      <h1 className="text-2xl font-bold text-center my-2 pb-2" style={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)"}}>{val.title}</h1>
      <div className="mx-4 my-2 pb-2 flex-grow overflow-auto" style={val.buttons.length > 0 ? {borderBottom: "1px solid rgba(0, 0, 0, 0.12)"} : undefined}>
        {val.child}
      </div>
      {val.buttons.length > 0 &&
      <div className="flex items-center justify-end w-full flex-shrink pb-2" style={{minHeight: "3em"}}>
        {val.buttons.map((val : ButtonProps, i : number) => <IconTextButton {...val} key={i} />)}
      </div>}
    </div>
  </div>
}
