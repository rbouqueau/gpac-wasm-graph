import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Fuse from "fuse.js";

import filtersData from "../data/filters.json";
import useFile from "../hooks/useFile";

// Custom comands
const commands = [
    {
        name: "import",
        description: "Import a file from the local file system"
    }
];

// Build the fuse index
const fuse = new Fuse(filtersData.concat(commands), {
    keys: ["name", "description"],
    threshold: 0.3
});

export default function SearchComponent({ onSelected }: { onSelected: (filter: object) => void }) {
    const ref = useRef(null);
    const { file, triggerFile } = useFile();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        if (query === " ") {
            setResults([]);
            setQuery("");
            return;
        }
        setResults(fuse.search(query));
        setQuery(query);
    };

    const handleSelected = (filter: object) => {
        if (filter.name === "import") {
            triggerFile();
            return;
        }

        onSelected(filter);
        setQuery("");
        setResults([]);
    };

    useEffect(() => {
        if (file) {
            onSelected(file);
            setQuery("");
            setResults([]);
        }
    }, [file]);

    useEffect(() => {
        // Focus the input
        if (ref.current) ref.current.focus();
    }, []);

    return (
        <div className="fixed left-1/2 top-1/3 flex w-2/5 -translate-x-1/2 -translate-y-1/3 flex-col items-center justify-center gap-4 rounded border bg-white p-4 shadow-lg">
            <input
                ref={ref}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="w-full rounded border border-gray-300 bg-gray-50 p-2"
                onInput={handleInput}
                placeholder="Search..."
                spellCheck={false}
                type="text"
                value={query}
            />
            <div
                className={clsx("w-full flex-col gap-2", results.length === 0 ? "hidden" : "flex")}
            >
                {results.slice(0, 6).map((result) => (
                    <div
                        key={result.item.name}
                        className="flex flex-col gap-1 rounded border border-gray-300 bg-gray-50 p-2"
                        onClick={() => handleSelected(result.item)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSelected(result.item);
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="font-bold">{result.item.name}</div>
                        <div className="text-sm">{result.item.description}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
