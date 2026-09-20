import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Finances — Tableau de bord',
  description: 'Application personnelle de gestion de finances',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
              <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
