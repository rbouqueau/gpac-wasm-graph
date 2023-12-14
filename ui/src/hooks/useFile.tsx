import { useState } from "react";

export default function useFile() {
    const [file, setFile] = useState(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files[0];
        setFile(file);
    };

    const triggerFile = () => {
        // Create a new input
        const input = document.createElement("input");
        input.id = "file";
        input.type = "file";
        input.accept = ".mp4";
        input.onchange = handleFile;
        input.click();
    };

    return {
        file,
        triggerFile
    };
}
