import { NextRouter, useRouter } from 'next/router';
import Head from 'next/head'
import Link from 'next/link'
import { Dispatch, SetStateAction, ReactElement, useEffect, useState, MouseEvent } from 'react';
import { FsOsFileInfo, FsReadDir, FsReadDirValue } from '../../api/fs';
import { Path } from '../../components/operation';
import { HumanSize } from '../../components/progress';

const DirMode = 2147483648

export interface FileProps {
  f: FsOsFileInfo,
  base: string,
  showTime?: boolean,
}

export function TrimForwardSlashes(str : string) : string {
  return "/"+(str.split("/").filter((v : string) => v.length > 0).join("/"));
}

export function SortByDirectory(a : FsOsFileInfo, b : FsOsFileInfo) : number {
  if(IsDirectory(a) && !IsDirectory(b))
    return -1;
  else if (!IsDirectory(a) && IsDirectory(b))
    return 1;
  return 0;
}

export function IsDirectory(a : FsOsFileInfo) {
  return (a.mode&DirMode) != 0
}

export interface ButtonProps {
  Text: string
  Icon?: string
}

export function Button(val : ButtonProps) {
  return <button className="bg-yellow-100 hover:bg-yellow-300 rounded px-5 py-1 flex items-center outline-0 mr-2" style={{transition: "background 300ms ease-in-out"}}>
  { val.Icon &&
    <svg className="mr-1" viewBox="0 0 24 24" style={{width: '1.5em', height: '1.5em'}}><path d={val.Icon} /></svg>
  }
    <span>{val.Text}</span>
  </button>
}

export function FileComponentIcon(val: FsOsFileInfo) {
  return <svg viewBox="0 0 24 24" style={{minWidth: "1.5em", minHeight: "1.5em", maxWidth: "1.5em", maxHeight: "1.5em"}}><path d={IsDirectory(val) ? "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" : "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"} /></svg>
}

export function FileComponentFilename(val : FsOsFileInfo) {
  return <p className="break-all ml-2">{val.name}</p>
}

export function FileComponentDate(val : FsOsFileInfo) : string {
  const d = new Date();
  d.setTime(Date.parse(val.modTime))

  return val.modTime !== undefined && val.modTime.length !== 0 ? (d.toISOString().slice(0, 10) + " " + d.toISOString().slice(11, 19)) : ""
}

export function FileComponent(val: FileProps) {
  return (
    <tr className={`p-1 font-mono w-full ${IsDirectory(val.f) ? "cursor-pointer" : "cursor-default"}`}>
      <td className="flex items-center my-2 pr-2 w-full select-none">
        <FileComponentIcon {...Object.assign({}, val.f)} />
        <FileComponentFilename {...Object.assign({}, val.f)} />
      </td>
      <td>{/* val.showTime && <p className="ml-auto mr-2">{ FileComponentDate(val.f) }</p> */}</td>
      <td>{/* val.f.size !== 0 && HumanSize(val.f.size) */}</td>
    </tr>
  );
}

export interface Tree {
  [name: string]: FsOsFileInfo[],
}

export function RenderTree(r : NextRouter, s : Dispatch<SetStateAction<Tree|undefined>>, m : Tree|undefined, path : string) : ReactElement[] {
  if(m === undefined) return []

  let arr : ReactElement[] = [];

  if(m[path] !== undefined)
    m[path].forEach((val : FsOsFileInfo, num: number) => {
      if(!IsDirectory(val)) return;

      const localPath = TrimForwardSlashes(path+"/"+val.name)
      let obj : FileProps = {
        f: val,
        base: "",
      };

      let fileInfo = m[localPath]
      let later : ReactElement[] = [];
      if(fileInfo !== undefined) {
        later = later.concat(<div className="ml-1">{RenderTree(r, s, m, localPath)}</div>)
      }

      arr = arr.concat(
        <div className="my-1" key={localPath+num.toString()}>
          <div className="flex items-center text-sm cursor-pointer select-none" onClick={() => {
            let obj = Object.assign({}, m);
            let paths : string[] = [];
            if(obj[localPath] !== undefined) {
              Object.keys(obj).forEach((v : string) => {
                if(v.includes(localPath)) paths.push(v);
              });
              paths.forEach((val : string) => delete obj[val]);

              s(obj)
              return;
            }

            FsReadDir("localhost:8080", {Name: localPath}).then((v : FsReadDirValue) => {
              obj[localPath] = v.files;

              s(obj);
            })
          }} onContextMenu={(e) => {
            e.preventDefault();

            const path = TrimForwardSlashes("/fs/"+localPath)
            r.push(path, path, { shallow: false });
          }}>
            <span></span>
            <FileComponentIcon {...val} />
            <FileComponentFilename {...val} />
          </div>
          {later}
        </div>
      )
    })

  return arr;
}

export function AllButLast(fs: Array<any>) : Array<any> {
  if(fs.length == 0) return fs
  return fs.slice(0, fs.length-1)
}

export default function Fs() {
  const router = useRouter();
  const [ init, setInit ] = useState<boolean>(false);
  const [ fileInfo, setFileInfo ] = useState<FsOsFileInfo[]|null>(null);
  const [ change, setChange ] = useState<boolean>(true);
  const [ base, setBase ] = useState<string>("/fs")
  const [ search, setSearch ] = useState<string>("");
  const [ treeFileInfo, setTreeFileInfo ] = useState<Tree>();

  useEffect(() => {
    if(!router.isReady) return;

    let query : string[] = []
    if(typeof router.query.slug === "string")
      query = query.concat(router.query.slug)
    else
      query = router.query.slug as string[];
    if(query === undefined) query = ["/"];

    if(!init) {
      setInit(true);

      router.events.on("routeChangeStart", function() {
        setChange(true)
      });

      FsReadDir("localhost:8080", {
        Name: "/",
      }).then((val : FsReadDirValue) => {
        let obj : Tree = {}
        if(treeFileInfo !== undefined) obj = treeFileInfo;

        obj["/"] = val.files;
        setTreeFileInfo(obj)
      })
    }

    if(change === true) {

      FsReadDir("localhost:8080", {
        Name: query.join("/"),
      }).then((val : FsReadDirValue) => {
        if(val.files === undefined) setFileInfo([])
        else {
          setFileInfo(val.files.sort(SortByDirectory));
        }

        setBase(TrimForwardSlashes("/fs/"+query.join("/")))
        setChange(false);
      });
    }
  }, [change, treeFileInfo, base, init, fileInfo, router]);

  const goToPath = function() {
    let a = prompt("");
    if(a && a.length > 0)
      router.push(TrimForwardSlashes("/fs/"+a), TrimForwardSlashes("/fs/"+a), { shallow: false })
  }

  let buttons : ReactElement[] = [];
  ["fs"].concat(router.query.slug as string[] || []).forEach(function(val : string, i : number, arr : string[]): void {
    buttons = buttons.concat(<Link href={TrimForwardSlashes("/"+arr.slice(0, i+1).join("/"))} key={val+i}>
      <button className="bg-gray-200 border-2 py-1 px-4 mr-1 rounded outline-0">
        {val == "fs" ? "/" : val}
      </button></Link>);

  })

  let dots : FileProps|undefined;
  if(base !== "/fs") {
    dots = {
      f: {
        name: "..",
        size: 0,
        path: "",
        modTime: "",
        mode: DirMode,
      },
      base: "",
      showTime: false,
    } as FileProps
  }

  return <div>
    <Head>
      <title>ft - filesystem</title>
    </Head>
    <div className="flex">
      <div className="px-4 pt-2 mr-4 text-md bg-yellow-200 min-h-screen" style={{minWidth: "300px"}}>
        <h1 className="text-3xl text-black font-bold mb-2">Filesystem tree</h1>
        {RenderTree(router, setTreeFileInfo, treeFileInfo, "/")}
      </div>
      <div>
        <div className="my-2 flex justify-end">
          <Link href={base}>
            {Button({ Text: "Refresh", Icon: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" })}
          </Link>
          <div onClick={goToPath}>
            {Button({ Text: "Go to Path", Icon: "M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M23 19L20 16V18H16V20H20V22L23 19Z"})}
          </div>
        </div>
        <div className="flex items-center my-2">
          <div className="flex-shrink ml-2">{buttons}</div>
          <div className="ml-auto border-l-2" style={{borderColor: "rgba(0, 0, 0, 0.12)"}}>
            <input className="h-9 ml-2 mr-2 pl-8 px-2 h-12 border-0 rounded-3xl outline-none bg-gray-200 text-black" type="text" placeholder="Search" onChange={(e) => setSearch(e.currentTarget.value)} />
          </div>
        </div>
        <div>
          <table className="table-fixed w-full text-xl">
            <thead>
              <tr>
                <td>Name</td>
                <td className="w-64">Last Modification</td>
                <td className="w-48">Size</td>
              </tr>
            </thead>
            <tbody>
  {dots && <Link href={AllButLast(Path(TrimForwardSlashes(base))).join("/")}><FileComponent {...Object.assign({}, dots)} /></Link>}
              {/* fileInfo !== null && fileInfo !== undefined && fileInfo.filter((x) =>
                search.length > 0 ? x.name.includes(search) : true
              ).map(function(x : FsOsFileInfo, i : number) {
                  const obj = {
                    f: x,
                    base: base,
                    showTime: true,
                  }

                  const path = TrimForwardSlashes(base+"/"+x.name)
                  return IsDirectory(x) ? <Link href={path} key={path+i.toString()}>
                    <FileComponent {...obj} />
                  </Link> : <FileComponent key={path+i.toString()} {...obj} />;
                }) */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
}
