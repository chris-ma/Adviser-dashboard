import type { Metadata } from 'next';
import './globals.css';
import { ShellClient } from '@/components/layout/ShellClient';

export const metadata: Metadata = {
  title: 'Adviser Market Intelligence',
  description: 'B2B market intelligence for the Australian financial adviser market',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ShellClient>{children}</ShellClient>
      </body>
    </html>
  );
}
