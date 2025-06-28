import React from 'react';
import { VersionInfo } from './ui/version-info';
import { Separator } from './ui/separator';

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <VersionInfo variant="footer" />
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>© 2024 Plan Pulse Compass</span>
            <span>•</span>
            <span>Team Planning & Resource Management</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/heymishy/plan-pulse-compass"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span>•</span>
            <a
              href="/settings"
              className="hover:text-foreground transition-colors"
            >
              Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
