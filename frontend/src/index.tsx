import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";

const divContainer = document.getElementById("root") as HTMLElement;
if (!divContainer) throw new Error("Root container not found");
const root = createRoot(divContainer);
root.render(<App />);
