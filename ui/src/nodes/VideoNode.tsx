import { useAsync } from "react-use";
import { Handle, Position } from "reactflow";
import clsx from "clsx";
import { Tooltip } from "@mui/material";
import styles from "./VideoNode.module.css";
import { inspectFile } from "../../lib/io/file";

export default function VideoNode({ data }) {
    const { file } = data;
    const state = useAsync(async () => inspectFile(file), [file]);

    return (
        <>
            <div className="flex flex-col rounded border-2 bg-neutral-100 shadow">
                <div className="px-2 py-1">
                    <h1 className="font-semibold">{file.name}</h1>
                </div>
                <div className="relative w-fit">
                    <div
                        className={clsx(
                            "absolute inset-0 z-10 h-full w-full items-center justify-center",
                            state.loading ? "flex" : "hidden"
                        )}
                    >
                        <div className={styles.loader} />
                    </div>
                    <video
                        autoPlay
                        className={clsx(
                            "inset-0 rounded transition-all duration-500",
                            state.loading && "blur"
                        )}
                        height="360"
                        loop
                        muted
                        src={URL.createObjectURL(file)}
                        width="480"
                    />
                </div>
            </div>
            {!state.loading &&
                state.value?.map((track, index) => (
                    <Tooltip placement="right" title={track.StreamType}>
                        <Handle
                            key={track.PID}
                            id={`${track.name}/${track.StreamType}`}
                            position={Position.Right}
                            style={{
                                top: `${((index + 1) * 100) / (state.value.length + 1)}%`,
                                backgroundColor:
                                    track.StreamType === "Visual"
                                        ? "green"
                                        : track.StreamType === "Audio"
                                          ? "blue"
                                          : "black",
                                width: "12px",
                                height: "12px",
                                right: "-5px"
                            }}
                            type="source"
                        />
                    </Tooltip>
                ))}
        </>
    );
}
