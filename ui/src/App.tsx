import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useKeyPressEvent, useMouse } from "react-use";
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    Node
} from "reactflow";
import SearchComponent from "./components/SearchComponent";
import VideoNode from "./nodes/VideoNode";
import FilterNode from "./nodes/FilterNode";
import CommandComponent from "./components/CommandComponent";

let index = 0;

function Flow({ node }) {
    const reactFlowInstance = useReactFlow();
    const ref = useRef(null);
    const { docX, docY } = useMouse(ref);
    const nodeTypes = useMemo(() => ({ videoNode: VideoNode, filterNode: FilterNode }), []);

    const isValidConnection = (connection) => {
        const nodes = reactFlowInstance.getNodes();
        const source = nodes.find((node) => node.id === connection.source);
        const target = nodes.find((node) => node.id === connection.target);

        let valid = true;

        // if both are filter nodes, check if they are compatible
        if (source.type === "filterNode" && target.type === "filterNode") {
            const sourceFilter = source.data.filter;
            const targetFilter = target.data.filter;

            // Check source and sinks
            valid &&= sourceFilter.sinks.includes(targetFilter.name);
            valid &&= targetFilter.sources.includes(sourceFilter.name);

            // Check stream types
            valid &&= connection.sourceHandle === connection.targetHandle;
        }

        // if source is a video node, check if the target is compatible
        if (source.type === "videoNode") {
            const targetFilter = target.data.filter;

            // Check sources
            // valid &&= targetFilter.sources.includes("fin"); // FIXME: There are implicit filters

            // Check stream types
            const [_, streamType] = connection.sourceHandle.split("/");

            valid &&= streamType === connection.targetHandle;
        }

        return valid;
    };

    useEffect(() => {
        if (!node) return;

        // Get mouse position
        const position = reactFlowInstance.project({ x: docX, y: docY });

        // Update position
        node.position = position;

        reactFlowInstance.addNodes(node);
        reactFlowInstance.fitView();
    }, [node]);

    return (
        <ReactFlow
            ref={ref}
            defaultEdgeOptions={{ type: "smoothstep" }}
            defaultEdges={[]}
            defaultNodes={[]}
            fitView
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            onEdgeDoubleClick={(event, edge) => {
                reactFlowInstance.setEdges((edges) => edges.filter((e) => e.id !== edge.id));
            }}
            onNodeDoubleClick={(event, node) => {
                reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
            }}
            snapToGrid
        >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} variant={BackgroundVariant.Dots} />
            <Panel position="top-left">
                <div className="rounded bg-white p-4 shadow">
                    <h1 className="text-xl font-bold">GPAC/WASM Demo</h1>
                </div>
            </Panel>
        </ReactFlow>
    );
}

export default function App() {
    // Search related stuff
    const [commandOpen, setCommandOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Keyboard listener
    useKeyPressEvent("c", () => setCommandOpen(!commandOpen));
    useKeyPressEvent(" ", () => setSearchOpen(!searchOpen));

    // Handle new filter selection
    const [node, setNode] = useState<Node>();
    const handleFilterSelected = async (filter: object) => {
        setSearchOpen(false);

        if (filter instanceof File) {
            const file = filter as File;
            setNode({
                id: `${++index}`,
                type: "videoNode",
                data: { file, label: file.name }
            });
        } else {
            setNode({
                id: `${++index}`,
                type: "filterNode",
                data: { filter, label: filter.name }
            });
        }
    };

    return (
        <ReactFlowProvider>
            <div style={{ width: "100vw", height: "100vh" }}>
                <Flow node={node} />
            </div>
            {searchOpen && <SearchComponent onSelected={handleFilterSelected} />}
            {commandOpen && <CommandComponent />}
        </ReactFlowProvider>
    );
}
