import { requirePageUser } from '@/lib/auth/security';
export default async function AccountLayout({ children }: { children: React.ReactNode }) { await requirePageUser(true); return children; }
