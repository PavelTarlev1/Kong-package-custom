export interface Route {
    name:string
    path: string
    service:string
    method: string
    id?:string
    auth:boolean
}
