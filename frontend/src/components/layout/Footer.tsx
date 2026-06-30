import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card/15 py-4 px-6 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          <span>&copy; 2026 SpotterAI. FMCSA Hours of Service Compliance Engine.</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">All compliance systems operational</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
