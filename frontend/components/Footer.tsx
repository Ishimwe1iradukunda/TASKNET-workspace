import React from 'react';
import { Github, Twitter, Book } from 'lucide-react';

export function Footer() {
  return (
    <footer className="h-14 bg-background border-t border-border flex items-center justify-between px-6 shrink-0 transition-colors">
      <div className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} TaskNet Workspace. All rights reserved.
      </div>
      <div className="flex items-center gap-4">
        <a href="https://github.com/Ishimwe1iradukunda" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <Github className="w-5 h-5" />
        </a>
        <a href="https://x.com/gtaekashi" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <Twitter className="w-5 h-5" />
        </a>
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
          <Book className="w-5 h-5" />
        </a>
      </div>
    </footer>
  );
}
