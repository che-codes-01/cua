import Logo from "./Logo";
import { FiGithub } from "react-icons/fi";

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
        <Logo href="/dashboard" />

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="/docs" className="transition hover:text-foreground">
            Documentation
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-foreground"
          >
            GitHub
          </a>
          <a href="/privacy" className="transition hover:text-foreground">
            Privacy
          </a>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="hidden sm:block text-muted-foreground transition hover:text-foreground"
        >
          <FiGithub className="size-4" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
