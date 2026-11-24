import { Logo } from "./Logo.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";

/** On every page: the logo goes home, the toggle flips the theme. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-gutter-phone md:px-gutter-laptop">
        <a href="#/" aria-label="Pausal, back to the start" className="-ml-1 rounded-md p-1 text-[18px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <Logo />
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
