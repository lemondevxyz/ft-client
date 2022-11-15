export function Loader() {
    return (
        <div className="fixed top-0 left-0 w-screen h-screen" style={{backgroundColor: "#151515"}}>
            <div className="fixed top-0 left-0 w-screen h-screen bg-yellow-500 flex flex-col items-center justify-center">
                <style scoped jsx>{`
    .loader, .loader:before, .loader:after {
        border-radius: 50%;
        width: 2.5em;
        height: 2.5em;
        animation-fill-mode: both;
        animation: bblFadInOut 1.8s infinite ease-in-out;
    }
    .loader {
        color: #FFF;
        font-size: 7px;
        position: relative;
        text-indent: -9999em;
        transform: translateZ(0);
        animation-delay: -0.16s;
    }
    .loader:before,
    .loader:after {
        content: '';
        position: absolute;
        top: 0;
    }
    .loader:before {
        left: -3.5em;
        animation-delay: -0.32s;
    }
    .loader:after {
        left: 3.5em;
    }

    @keyframes bblFadInOut {
        0%, 80%, 100% { box-shadow: 0 2.5em 0 -1.3em }
        40% { box-shadow: 0 2.5em 0 0 }
    }
    `}</style>
                <span className="loader"></span>
                <p className="text-center mt-12 font-bold text-white">Connecting to the server; <br /> this may take while</p>
            </div>
        </div>
    )
}
