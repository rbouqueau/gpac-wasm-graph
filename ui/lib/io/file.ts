import GPACWrapper from "../gpac";

export default async function inspectFile(file: File): Promise<object> {
    const libgpac = GPACWrapper.getInstance();
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
            const data = new Uint8Array(fr.result as ArrayBuffer);

            const path = "/root/video.mp4";
            libgpac.writeFile(path, data);

            libgpac.execute(
                ["-i", "/root/video.mp4", "inspect:xml"],
                (result: object | null, err?: number) => {
                    if (err) reject(err);
                    else resolve(result as object);
                }
            );
        };
        fr.readAsArrayBuffer(file);
    });
}
