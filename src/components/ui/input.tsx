import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-sm border border-border bg-paper px-3 text-sm text-ink placeholder:text-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
