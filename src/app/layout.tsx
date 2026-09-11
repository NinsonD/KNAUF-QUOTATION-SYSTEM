import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Al Namariq | Knauf Quotation Calculator SaaS',
  description: 'B2B SaaS Quotation Engine for Al Namariq Building Material Trading Co. LLC (Sharjah, UAE) utilizing official Knauf systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="no-print bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-semibold text-slate-700">
              Al Namariq Building Material Trading Co. LLC • P.O. 25569, Sharjah, UAE
            </p>
            <p className="mt-1 text-slate-400">
              Official Knauf Drywall & Suspended Ceiling Quotation Calculator Engine
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
