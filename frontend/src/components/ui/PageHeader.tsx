import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-5 mb-6 select-none">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-[700px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex gap-2 shrink-0">{children}</div>}
    </div>
  );
};

export default PageHeader;
