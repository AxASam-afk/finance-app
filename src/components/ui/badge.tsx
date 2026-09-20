import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-surface text-ink',
      jade: 'bg-jade-soft text-jade',
      clay: 'bg-clay-soft text-clay',
      sand: 'bg-sand-soft text-sand',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
