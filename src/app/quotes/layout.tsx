import { requirePageUser } from '@/lib/auth/security';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) { await requirePageUser(); return children; }
