declare module "node:fs/promises" {
    const anyExport: any;
    export default anyExport;
}

declare module "node:path" {
    const anyExport: any;
    export default anyExport;
}

declare module "node:http" {
    export const createServer: any;
}

declare module "node:vm" {
    export const Script: any;
    export const createContext: any;
}

declare const process: any;
