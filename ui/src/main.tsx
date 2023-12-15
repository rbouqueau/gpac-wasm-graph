import { render } from "preact";
import App from "./app.tsx";
import "./index.css";
import "reactflow/dist/style.css";

render(<App />, document.getElementById("app")!);
