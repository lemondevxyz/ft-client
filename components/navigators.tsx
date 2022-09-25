import { FixPath } from "../api/fs";

export function Navigators({ pwd, setPwd } : { pwd: string, setPwd: (pwd : string) => void }) {
  return (
    <>
      {["/"].concat(pwd.split("/")).filter((val : string) => val.length > 0).map((val : string, i : number, arr : string[]) =>
        <button className="bg-gray-200 border-2 py-1 px-4 mt-1 mr-1 rounded outline-0" onClick={() => setPwd(FixPath("/"+arr.slice(0, i+1).join("/")))} key={val+i.toString()}>
          {val}
        </button>)}
    </>
  );
}
