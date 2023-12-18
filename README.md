# GPAC/WASM Interactive Graph Demo

This is a demo of using GPAC in WebAssembly to import media files and use a graph builder to generate a command to execute such a graph.

> **WARNING**: This is a very early demo, there may be instabilities and bugs. It's flooded with typing and lint errors :)

## Important notes

- `ui/lib/gpac/index.ts`: This file shows a very primitive way of using GPAC in WASM. It handles file import and executing the GPAC.
- `ui/lib/io/file.ts`: Here, you can find an example of how to use the above wrapper to execute a GPAC command.
- `generator/src/main.py`: Parses the help output of GPAC and generates the `ui/src/data/[filters,codecs].json` files. Usage of [Poetry](https://python-poetry.org/) is recommended.
- Due to the [security requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements) of SharedArrayBuffer, Vite server adds two additional headers to the response. Keep this in mind if you plan on running this demo on a different server.

## Running

To run this demo, you need to have [Poetry](https://python-poetry.org/) installed. Then, run the following commands:

> Since this is a demo, the JSON files are already generated and commited. You can skip the `generator` steps if you want.

```bash
# Install dependencies
cd generator/
poetry install
poetry run python src/main.py

# Run the UI
cd ../ui/
npm ci
npm run dev
```
