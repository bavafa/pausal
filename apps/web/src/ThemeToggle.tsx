import { useState } from "react";

// Dark by default; the choice is kept in localStorage under "theme".
export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const flip = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };
  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={dark}
      className="fixed top-3 right-3 z-50 min-h-11 min-w-11 rounded-md border border-border bg-card px-3 text-label text-foreground hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {dark ? "Light theme" : "Dark theme"}
    </button>
  );
}
