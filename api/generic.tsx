export function GenericRequest(url: string, val : any) : Promise<Response> {
    return new Promise((resolve, reject) =>
        fetch(url, {
            method: "post",
            headers: {'Content-Type': 'application/json'},
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
