import React, { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  searchIcon?: boolean;
}

export const Input: React.FC<InputProps> = ({
  searchIcon = false,
  className = '',
  ...props
}) => {
  return (
    <div className="relative w-full">
      {searchIcon && (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      )}
      <input
        className={`flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
          searchIcon ? 'pl-9' : ''
        } ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
