import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <p>Pausall. Experiment in progress. All ads are simulated.</p>
  </StrictMode>,
);
