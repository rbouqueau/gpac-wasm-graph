import React, { useEffect } from "react";
import { useReactFlow } from "reactflow";

export default function CommandComponent() {
    const reactFlowInstance = useReactFlow();
    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();

    useEffect(() => {
        console.log(nodes);
        console.log(edges);
    }, [nodes, edges]);

    return (
        <div className="fixed bottom-1/4 left-1/2 flex w-2/5 -translate-x-1/2 -translate-y-2/3 flex-row items-center justify-center gap-2 rounded border bg-gray-800 p-4 text-white shadow-lg">
            <code>gpac -i input.mp4</code>
            {nodes
                .filter((n) => !!n.data.filter)
                .map((node) => (
                    <code>{node.data.filter.name}</code>
                ))}
            <code>-o output.mp4</code>
        </div>
    );
}
