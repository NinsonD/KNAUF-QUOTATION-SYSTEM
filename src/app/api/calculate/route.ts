import { requireApiUser } from '@/lib/auth/security';
import { NextRequest, NextResponse } from 'next/server';
import { calculationInput, buildCalculation } from '@/lib/engine/validation';
import { getQuotationPrices } from '@/lib/engine/prices';
export async function POST(req: NextRequest) {
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
 try {
  const parsed=calculationInput.safeParse(await req.json());
  if(!parsed.success) return NextResponse.json({error:'Enter a valid system, positive area, dimensions and non-negative rates.'},{status:400});
  const result=buildCalculation(parsed.data,await getQuotationPrices());
  return NextResponse.json(result);
 } catch(error) { return NextResponse.json({error:error instanceof Error && /technical|quantity|Area|Unknown Knauf|Material factors/i.test(error.message) ? error.message : 'Calculation is temporarily unavailable.'},{status:400}); }
}
