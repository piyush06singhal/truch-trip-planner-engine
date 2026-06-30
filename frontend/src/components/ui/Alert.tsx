import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  className = '',
  ...props
}) => {
  const baseStyle = 'flex gap-3 rounded-lg border p-4 text-sm';
  
  const variants = {
    info: 'bg-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/20',
    success: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    warning: 'bg-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/20',
    destructive: 'bg-destructive/5 text-destructive border-destructive/20'
  };

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    destructive: AlertCircle
  };

  const Icon = icons[variant];

  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`} role="alert" {...props}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1 flex-1">
        {title && <h5 className="font-semibold leading-none tracking-tight text-foreground">{title}</h5>}
        <div className="text-muted-foreground leading-normal text-xs sm:text-sm">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
