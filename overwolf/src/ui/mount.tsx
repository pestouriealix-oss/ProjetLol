import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import "../styles.css";

/**
 * Monte une fenêtre. À la fermeture, React se démonte proprement : la
 * fenêtre cesse d'écouter le contrôleur, qui vit dans une autre fenêtre.
 */
export function mount(node: ReactNode) {
  const element = document.getElementById("root");
  if (!element) return;
  const root = createRoot(element);
  root.render(<StrictMode>{node}</StrictMode>);
  window.addEventListener("beforeunload", () => root.unmount());
}
