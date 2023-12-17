import { render } from "preact";
import App from "./App.tsx";
import "./index.css";
import "reactflow/dist/style.css";

render(<App />, document.getElementById("app")!);
