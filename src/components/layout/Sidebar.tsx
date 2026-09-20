'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  LineChart,
  CalendarDays,
  BarChart3,
  PiggyBank,
  Repeat,
  Bot,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/previsionnel', label: 'Prévisionnel', icon: LineChart },
  { href: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { href: '/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/epargne', label: 'Épargne', icon: PiggyBank },
  { href: '/recurrences', label: 'Récurrences', icon: Repeat },
  { href: '/assistant', label: 'Assistant IA', icon: Bot },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-paper md:flex md:flex-col">
      <div className="px-5 py-6">
        <span className="text-base font-semibold tracking-tight">Finances</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors',
                active ? 'bg-jade-soft text-jade' : 'text-muted hover:bg-surface hover:text-ink'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
