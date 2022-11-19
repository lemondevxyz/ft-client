export function Loader() {
    return (
        <div className="fixed top-0 left-0 w-screen h-screen" style={{backgroundColor: "#151515"}}>
            <div className="fixed top-0 left-0 w-screen h-screen bg-yellow-500 flex flex-col items-center justify-center">
                <span className="loader"></span>
                <p className="text-center mt-12 font-bold text-white">Connecting to the server; <br /> this may take while</p>
            </div>
        </div>
    )
}
