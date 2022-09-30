import { useRouter } from 'next/router';
import Head from 'next/head'
import { ReactElement, useEffect, useState } from 'react';
import { FsMkdir, FsOsFileInfo, FsReadDir, FsReadDirValue } from '../api/fs';
import { Tree, TreeMap } from '../components/tree';
import { Browser, BrowserDirectoryDialog, BrowserProps, FileActions } from '../components/browser';
import { IconTextButton } from '../components/button';
import { Navigators } from '../components/navigators';
import { globalHost, Map, PageProps } from './_app';
import { OperationBehaivor, OperationGenericData, OperationNew, OperationObject, OperationSetSources, OperationStart } from '../api/operation';
import { OperationComponent, OperationProps, OperationSidebar } from '../components/operation';
import { RequestOptions } from '../api/generic';
import { Dialog } from '../components/dialog';

export function Path(val : string) : string[] {
  return val.split("/");
}

export function TrimForwardSlashes(str : string) : string {
  return "/"+(str.split("/").filter((v : string) => v.length > 0).join("/"));
}

// const now = new Date();

const iconFolderArrow = "M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M23 19L20 16V18H16V20H20V22L23 19Z";
const iconFolderAdd = "M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10M15,9V12H12V14H15V17H17V14H20V12H17V9H15Z"
const iconRefresh = "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z";
const iconFolderFile = "M15 8C12.79 8 11 9.79 11 12V20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V10.17L20.41 8.59L19.83 8H15M23 14V21C23 22.11 22.11 23 21 23H15C13.9 23 13 22.11 13 21V12C13 10.9 13.9 10 15 10H19L23 14M21 14.83L18.17 12H18V15H21V14.83Z";

export default function Fs(val : PageProps) {
  const router = useRouter();
  // used by FsComponent
  const base = "/"+(router.query.slug as string[] || []).join("/");
  const [ pwd, setPwd ] = useState<string>(base);
  const [ search, setSearch ] = useState<string>("");
  const [ checked, setChecked ] = useState<string[]>([]);
  const [ ready, setReady ]= useState(false);
  // used by FsTree
  const [ treeFileInfo, setTreeFileInfo ] = useState<TreeMap>();
  // used by this component
  const [ showOperations, setShowOperations ] = useState(false);
  const [ reqOptions, setReqOptions ] = useState<RequestOptions>({
    host: "localhost:8080",
    id: val.id
  });
  const [ showCopyPaths, setShowCopyPaths ] = useState(false);

  useEffect(() => {
    if(!router.isReady || ready) return

    FsReadDir(reqOptions, {
      Name: "/",
    }).then((val : FsReadDirValue) => {
      let obj : TreeMap = {}
      if(treeFileInfo !== undefined) obj = treeFileInfo;

      obj["/"] = val.files;
      setTreeFileInfo(obj)
    });
  }, [router, ready]); // eslint-disable-line

  useEffect(() => {
    if(!ready) return;

    const eventFsUpdate = (e : string) => {
      const base = e.split("/").slice(0, -1).join("/");
      if(treeFileInfo === undefined) return;

      if(treeFileInfo[e])
        FsReadDir(reqOptions, {Name: e}).then((v : FsReadDirValue) => {
          let obj = Object.assign({}, treeFileInfo);
          obj[e] = v.files;

          setTreeFileInfo(obj)
        })

      if(treeFileInfo[base])
        FsReadDir(reqOptions, {Name: base}).then((v : FsReadDirValue) => {
          let obj = Object.assign({}, treeFileInfo);
          obj[base] = v.files;

          setTreeFileInfo(obj)
        })
    }

    if(val.ev)
      val.ev.addListener("fs-update", eventFsUpdate);

    return () => {
      if(val.ev) val.ev.removeListener("fs-update", eventFsUpdate);
    }
  }, [ready, treeFileInfo]); // eslint-disable-line

  useEffect(() => {
    // run once the router has initialized
    if(!router.isReady || ready) return;
    setReqOptions({
      host: "localhost:8080",
      id: val.id
    });

    setPwd(base);
    setReady(true);
  }, [router]); // eslint-disable-line

  const pwdSetter = (pwd : string) => {
    //if(pwd === "/") path = "/fs";

    router.push(pwd, pwd, { shallow: true });
    setPwd(pwd);
  }

  const goToPath = function() {
    let a = prompt("Enter a directory path to go to");
    if(a && a.length > 0) pwdSetter(a);
  }

  const fs : BrowserProps = {
    pwd: pwd,
    setPwd: pwdSetter,
    showParent: pwd.length > 1,
    checked: checked,
    setChecked: (obj : string[]) => {
      setChecked(obj);
    },
    filter: (val : FsOsFileInfo) => search.length === 0 ? true : val.name.includes(search),
    ev: val.ev,
    options: reqOptions,
  };

  const mkdir = () => {
    let dirPath = prompt("Enter the directory's name or path");
    if(dirPath === null) return;

    if(dirPath.at(0) !== "/")
      dirPath = pwd.split("/").concat(dirPath).join("/")

    FsMkdir(reqOptions, { Name: dirPath })
  }

  const [dirDialog, setDirDialog] = useState("null");
  const dirDialogComponent = BrowserDirectoryDialog({
    options: reqOptions,
    base: "/home/tim",
    dialogFn: (path: string) => {
      setDirDialog(path);

      const ops : Map<OperationObject> = val.ops || {};

      const pathSlice = path.split("/");
      const comparefn = (val : string) => pathSlice.includes(val);

      const op : OperationObject | undefined = Object.values(ops).find((val : OperationObject) => {
        const arr = val.dst.split("/")

        // "/home/tim/" becomes ["/home/tim", "/home/tim/"]
        if(arr !== undefined && arr[arr.length-1] === '')
          return arr.slice(0, -1).every(comparefn) || arr.every(comparefn)
        return arr.every(comparefn)
      });

      if(op === undefined) {
        OperationNew(reqOptions, {
          writer_id: val.id,
          src: checked,
          dst: path,
        })

        new Notification("Created new operation");
      } else {
        let paths = op.src.map((val : FsOsFileInfo) : string => val.absPath);
        paths = paths.concat(checked);

        OperationSetSources(reqOptions, {
          id: op.id,
          srcs: paths,
        })
      }
    },
    close: () => setDirDialog("null"),
    show: dirDialog.length === 0,
  })

  const copy = () => {
    setDirDialog("");
  }

  const copyPaths = () => {
    setShowCopyPaths(true);
  }

  const pathTextarea = () => <textarea className="p-4 h-3/4 w-full resize-none" style={{backgroundColor: "rgba(0, 0, 0, 0.2)"}} value={checked.join("\n")} onClick={(e) => {
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}}></textarea>;

  return <div>
    <Head>
      <title>ft - filesystem</title>
    </Head>
    <div className="flex text-dark-head relative">
      {Dialog({
        buttons: [],
        title: "Copy Path",
        show: showCopyPaths,
        close: () => setShowCopyPaths(!showCopyPaths),
        child: pathTextarea(),
      })}
      {/*showOperations && <OperationDialog {...opDialogProps} />*/}
      {dirDialogComponent}
      {FileActions({checked, setChecked, copy, copyPaths, options: reqOptions})}
      <div className="hidden md:block px-4 pt-2 text-md bg-less-dark min-h-screen text-light-head" style={{minWidth: "300px"}}>
        <h1 className="text-3xl font-bold mb-2">Filesystem tree</h1>
        {Tree({path: "/", setPwd: pwdSetter, tree: treeFileInfo, setTree: setTreeFileInfo, options: reqOptions})}
      </div>
      <div className="ml-4 md:ml-8 mr-2 min-w-content md:min-w-[750px] mb-24 overflow-hidden">
        <div className="flex flex-wrap md:flex-nowrap">
          <div className="mt-2 w-full sm:w-1/3 md:w-auto flex justify-center sm:justify-start md:block">
            {IconTextButton({ dark: true, text: "Go to Path", icon: iconFolderArrow, click: goToPath })}
          </div>
          <div className="mt-2 w-full sm:w-1/3 md:w-auto flex justify-center md:block">
            {IconTextButton({ dark: true, text: "Refresh", click: () => val.ev.emit("fs-update", pwd), icon: iconRefresh})}
          </div>
          <div className="mt-2 w-full sm:w-1/3 md:w-auto flex justify-center sm:justify-end md:block">
            {IconTextButton({ dark: true, text: "Create Directory", click: mkdir, icon: iconFolderAdd})}
          </div>
        </div>
        <div className="flex flex-wrap items-center my-2 mb-6">
          <div className="shrink">
            <Navigators {...{pwd: pwd, setPwd: pwdSetter}} />
          </div>
          <div className="mt-2 w-full sm:w-auto flex justify-center md:justify-end ml-auto shrink-0">
            <input className="h-9 text-se ml-2 mr-2 pl-4 px-2 h-10 border-0 rounded-3xl outline-none focus:bg-yellow-300 bg-gray-200 transition-colors transition-300ms placeholder-dark-disabled text-black" type="text" placeholder="Search" onChange={(e) => setSearch(e.currentTarget.value)} />
          </div>
        </div>
        <div className="flex text-md sm:text-lg md:text-xl w-full">
          <div className="overflow-x-auto">
            {ready && <Browser {...fs} />}
          </div>
        </div>
      </div>
      <div className="fixed bottom-5 right-5 w-16 h-16 bg-dark items-center justify-center flex text-white rounded-full text-2xl" onClick={() => setShowOperations(true)}>
        <svg style={{width: '1em', height:'1em', fill: 'currentColor'}}><path d={iconFolderFile} /></svg>
      </div>
      {OperationSidebar({
        ops: val.ops,
        ev: val.ev,
        pwdSetter,
        options: reqOptions,
        setShow: (val : boolean) => setShowOperations(val),
        show: showOperations,
      })}
    </div>
  </div>
}
