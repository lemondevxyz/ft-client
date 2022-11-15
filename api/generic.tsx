import { FullConfiguration, SWRResponse } from "swr/dist/types";

export interface GenericOptions {
    url: string
    id: string
}

export interface RequestOptions {
    host: string
    id: string
}

export function ApiURL(route : string) : string {
    return `/api/v0/${route}`;
}

export interface Response<T> extends Parameters<T> {
  isLoading: boolean,
}

interface Parameters<T> {
  data: T,
  error: any,
}

export function returnResponse({ data, error } : SWRResponse<any, any>) : Response<any> {
  return {data, isLoading: !data && !error, error}; }

export function returnPromise(cfg : FullConfiguration, earl : string, val : any) : Promise<any> {
    const { fetcher } = cfg
    if(fetcher === undefined) return Promise.reject("fetcher is undefined");

    return fetcher(earl, val) as Promise<any> }

// export function GenerateRequestFunction(path: string, val : <T>) : (options: RequestOptions, val: <T>) => Promise<Response> {
//     Map
//     return function(options: RequestOptions, val: <T>) : Promise<Response> {
//         return GenericRequest({url: ApiURL(options.host, path), id: options.id}, val)
//     }
// }
