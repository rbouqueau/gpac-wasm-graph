import xml2js from "xml-js";
import type { LibGPAC } from "./types";

class GPACWrapper {
    static instance: GPACWrapper | null = null;

    lib: LibGPAC = {} as LibGPAC;

    stack: unknown = null;

    messages: string[] = [];

    constructor() {
        // Only allow one instance
        if (GPACWrapper.instance) return;

        // Set defaults
        this.lib = {
            ...this.lib,

            // Do not run the library on import
            noInitialRun: true,

            // Do not exit the runtime on exit
            noExitRuntime: true
        };

        // Bind the methods to the library
        this.lib.print = (msg: string) => {
            const message = msg.trim();
            if (message === "") return;
            this.messages.push(message);
        };
        this.lib.printErr = (msg: string) => console.error(msg);
        this.lib.onRuntimeInitialized = this.#onRuntimeInitialized.bind(this);
    }

    static getInstance(): GPACWrapper {
        // If the instance is null, create a new one
        if (!GPACWrapper.instance) GPACWrapper.instance = new GPACWrapper();

        // Return the instance
        return GPACWrapper.instance;
    }

    #onRuntimeInitialized() {
        // Create the root directory
        this.lib.FS.mkdir("/root");
        this.lib.FS.mount(this.lib.IDBFS, {}, "/root");

        // Sync the filesystem
        this.lib.FS.syncfs(true, (err: any) => {
            if (err) console.error(err);
            console.log("Synced filesystem");
        });

        console.log("Initialized GPAC");
    }

    #getExecuteResult(): object {
        const raw_xml = this.messages.join("\n");
        const json = xml2js.xml2js(raw_xml, { compact: true });
        return json.GPACInspect.PIDConfigure.map((item: any) => item._attributes);
    }

    /**
     * Write a file to the filesystem
     *
     * @param path The path to the file
     * @param data The data to write
     * @param mode The mode to open the file with
     */
    writeFile(path: string, data: Uint8Array, mode: string = "w+") {
        const fd = this.lib.FS.open(path, mode);
        this.lib.FS.write(fd, data, 0, data.length);
        this.lib.FS.close(fd);
    }

    /**
     * Read a file from the filesystem
     *
     * @param path The path to the file
     */
    readFile(path: string): Uint8Array {
        return this.lib.FS.readFile(path, { encoding: "binary" });
    }

    /**
     * Execute the GPAC library
     *
     * @param args The arguments to pass to the library
     * @returns Whether the execution was successful
     */
    execute(args: string[], callback: (result: object | null, err?: number) => void) {
        // Setup stack
        this.stack = this.lib.stackSave();
        args.unshift("gpac");
        const argc = args.length;
        const argv = this.lib.stackAlloc((argc + 1) * 4);
        // eslint-disable-next-line no-bitwise
        let pArgv = argv >> 2;
        args.forEach((arg) => {
            // eslint-disable-next-line no-plusplus
            this.lib.HEAP32[pArgv++] = this.lib.allocateUTF8OnStack(arg);
        });
        this.lib.HEAP32[pArgv] = 0;

        // Set callback
        this.lib.gpac_done = (code: number) => {
            if (code !== 0) {
                console.error(`GPAC exited with code ${code}`);
                return callback(null, code);
            }
            return callback(this.#getExecuteResult());
        };

        // Clear message buffer
        this.messages = [];

        try {
            this.lib._main(argc, argv);
        } catch (error) {
            if (error !== "unwind") {
                throw error;
            }
        }
    }
}

window.addEventListener("load", () => {
    const wrapper = GPACWrapper.getInstance();
    libgpac(wrapper.lib);
});

export default GPACWrapper;
