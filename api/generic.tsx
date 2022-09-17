export function GenericRequest(url: string, val : any) : Promise<Response> {
    return fetch(url, {
        method: "post",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(val),
    })
}

export function ApiURL(host : string, route : string) : string {
    return `http://${host}/api/v0/${route}`;
}
