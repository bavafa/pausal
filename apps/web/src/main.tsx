import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { SiteHeader } from "./SiteHeader.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// Fonts load lazily on first use; fetch every bundled face now so a pause never waits on the network (AD-1).
for (const face of ["400 1em Raleway", "500 1em Raleway", "600 1em Raleway", "500 1em Lora"]) void document.fonts.load(face);

createRoot(root).render(
  <StrictMode>
    <SiteHeader />
    <App />
  </StrictMode>,
);
