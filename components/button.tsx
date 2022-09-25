export interface ButtonProps {
  text: string,
  icon?: string,
  click?: () => void,
  dark?: boolean,
}

export function IconTextButton(val : ButtonProps) {
    return <button className={`${val.dark ? "bg-dark text-white font-bold hover:bg-less-dark border-2 border-less-dark" : "bg-yellow-100 hover:bg-yellow-300 text-black"} rounded px-6 py-2 flex items-center outline-0 mr-2 transition-colors flex-nowrap`} onClick={() => val.click !== undefined && val.click()}>
        { val.icon &&
          <svg className="mr-1 shrink-0" viewBox="0 0 24 24" style={{width: '1.25em', height: '1.25em', fill: 'currentColor'}}><path d={val.icon} /></svg>
        }
        <span className="break-none">{val.text}</span>
    </button>
}

export function IconButton(val : ButtonProps) {
    return <div className="cursor-pointer text-black opacity-75 hover:opacity-100 px-2 py-2 text-4xl" style={{transition: "opacity 300ms ease-in-out"}} title={val.text} aria-label={val.text} onClick={() => val.click && val.click()}>
        <svg style={{width: '1em', height: '1em', fill: 'currentColor'}} viewBox="0 0 24 24">
            <path d={val.icon} />
        </svg>
    </div>
}
