/// <reference types="emscripten" />

interface FS {
    open(path: string, mode?: string): number;
    close(fd: number): void;
    write(fd: number, data: Uint8Array, offset: number, length: number): void;
    mkdir(path: string, mode?: number): void;

    readFile(path: string, opts: any): Uint8Array;

    mount(type: string, opts: any, mountpoint: string): void;
    syncfs(populate: boolean, callback: (err: any) => void): void;
}

export interface LibGPAC extends EmscriptenModule {
    FS: FS;
    IDBFS: string;
    stackSave(): unknown;
    stackAlloc(size: number): number;
    allocateUTF8OnStack(arg: string): number;
    gpac_done(code: number): void;
}
