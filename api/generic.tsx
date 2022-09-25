import EventEmitter from "events";

export interface GenericOptions {
    url: string
    id: string
}

export interface RequestOptions {
    host: string
    id: string
}

export function GenericRequest(options : GenericOptions, val : any) : Promise<Response> {
    return new Promise((resolve, reject) =>
        fetch(options.url, {
            method: "post",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${options.id}`},
            body: JSON.stringify(val),
        }).then((p: Response) => {
            if(p.status !== 200) reject(p)
            else resolve(p)
        }).catch((e) => reject(e))
    );
}

export function ApiURL(host : string, route : string) : string {
    return `http://${host}/api/v0/${route}`;
}

// export function GenerateRequestFunction(path: string, val : <T>) : (options: RequestOptions, val: <T>) => Promise<Response> {
//     Map
//     return function(options: RequestOptions, val: <T>) : Promise<Response> {
//         return GenericRequest({url: ApiURL(options.host, path), id: options.id}, val)
//     }
// }
