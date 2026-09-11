import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/auth/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Al Namariq | Knauf Quotation Engine',
  description: 'B2B SaaS Quotation Engine for Al Namariq Building Material Trading Co. LLC (Sharjah, UAE) utilizing official Knauf systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#cfd9e5] text-slate-800 p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-start">
        <AuthProvider>
          {/* Main Floating Bento Canvas matching Reference UI */}
          <div className="app-bento-canvas w-full max-w-[1520px] bg-[#fbfbfa] rounded-[36px] sm:rounded-[44px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-white/80 overflow-hidden flex flex-col relative min-h-[92vh] print:min-h-0 print:bg-white print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none">
            {/* Subtle Ambient Glow Meshes (Hidden in print) */}
            <div className="no-print absolute -top-24 -right-24 w-96 h-96 bg-[#f86c29]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="no-print absolute top-1/3 -right-20 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="no-print absolute -bottom-20 -left-20 w-96 h-96 bg-[#00488e]/8 rounded-full blur-3xl pointer-events-none" />

            {/* Navigation Bar inside the Canvas */}
            <Navbar />

            {/* Main App Content Area */}
            <main className="flex-1 w-full px-4 sm:px-8 lg:px-10 py-6 relative z-10">
              {children}
            </main>

          {/* Canvas Footer */}
          <footer className="no-print border-t border-slate-900/[0.04] py-5 px-8 text-center text-xs text-slate-400 bg-white/40 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Al Namariq Building Material Trading Co. LLC • P.O. 25569, Sharjah, UAE
            </div>
            <div className="text-slate-400 text-[11px]">
              Certified Knauf Systems Engine • Ph: (06) 5328033
            </div>
          </footer>
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}

