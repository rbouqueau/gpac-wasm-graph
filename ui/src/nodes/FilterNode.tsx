import { Tooltip } from "@mui/material";
import Fuse from "fuse.js";
import { useMemo } from "preact/hooks";
import { Handle, Position } from "reactflow";

export default function FilterNode({ data }) {
    const { filter } = data;
    const fuse = useMemo(() => new Fuse(Object.keys(filter.options)), [filter]);

    const getType = (type) => {
        switch (type) {
            case "dbl":
            case "uint":
            case "uintl":
                return ["input", "number"];
            case "strl":
            case "str":
                return ["input", "text"];
            case "bool":
                return ["input", "checkbox"];
            case "enum":
                return ["select", null];
            default:
                return ["input", "text"];
        }
    };

    return (
        <>
            {filter.capabilities.input.stream_type.map((stream_type, index) => (
                <Tooltip placement="left" title={stream_type}>
                    <Handle
                        id={stream_type}
                        position={Position.Left}
                        style={{
                            top: `${
                                ((index + 1) * 100) /
                                (filter.capabilities.input.stream_type.length + 1)
                            }%`,
                            backgroundColor:
                                stream_type === "Visual"
                                    ? "green"
                                    : stream_type === "Audio"
                                      ? "blue"
                                      : "black",
                            width: "12px",
                            height: "12px",
                            left: "-5px"
                        }}
                        type="target"
                    />
                </Tooltip>
            ))}

            <div className="flex flex-col divide-y-2 rounded border-2 bg-neutral-100 shadow">
                <div className="px-2 py-1">
                    <h1 className="text-2xl font-semibold">{filter.name}</h1>
                    <p className="text-sm">{filter.description}</p>
                </div>
                <ul
                    className="px-2 py-1"
                    hidden={
                        Object.entries(filter.options).filter(
                            ([key, value]) => !("default" in value) || value.default === "none"
                        ).length === 0
                    }
                >
                    {Object.entries(filter.options)
                        .filter(([key, value]) => !("default" in value) || value.default === "none")
                        .map(([key, value]) => {
                            const [type, inputType] = getType(value.type);
                            return (
                                <li className="flex items-stretch divide-x-2">
                                    <div className="flex w-1/2 flex-col">
                                        <h1 className="font-semibold">{key}</h1>
                                        <p className="text-sm">{value.description}</p>
                                    </div>
                                    {type === "input" && (
                                        <input
                                            className="my-1 h-8 w-1/2 rounded bg-white px-2 py-1"
                                            type={inputType}
                                        />
                                    )}
                                    {type === "select" && (
                                        <select className="my-1 h-8 w-1/2 rounded bg-white px-2 py-1">
                                            {Object.entries(value.enum).map(([key, value]) => (
                                                <option value={key}>{value}</option>
                                            ))}
                                        </select>
                                    )}
                                </li>
                            );
                        })}
                    <li className="flex items-stretch divide-x-2">
                        <div className="flex w-1/2 flex-col">
                            <input
                                className="my-1 h-8 w-full rounded border-2 bg-white px-2 py-1  "
                                disabled
                                placeholder="Type to add another option"
                                type="text"
                            />
                        </div>
                    </li>
                </ul>
            </div>

            {filter.capabilities.output.stream_type.map((stream_type, index) => (
                <Tooltip placement="right" title={stream_type}>
                    <Handle
                        id={stream_type}
                        position={Position.Right}
                        style={{
                            top: `${
                                ((index + 1) * 100) /
                                (filter.capabilities.output.stream_type.length + 1)
                            }%`,
                            backgroundColor:
                                stream_type === "Visual"
                                    ? "green"
                                    : stream_type === "Audio"
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
