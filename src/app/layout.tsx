import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/AuthContext';
import DeskShell from '@/components/layout/DeskShell';
import './globals.css';

export const metadata: Metadata = { title: 'Al Namariq | Quotations', description: 'Create and manage Knauf material quotations.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AuthProvider><a href="#main-content" className="desk-skip-link">Skip to content</a><DeskShell>{children}</DeskShell></AuthProvider></body></html>;
}
