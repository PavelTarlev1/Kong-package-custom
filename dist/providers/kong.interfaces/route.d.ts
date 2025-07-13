export interface Route {
    name: string;
    path: string;
    method: string;
    id?: string;
    auth: boolean;
}
