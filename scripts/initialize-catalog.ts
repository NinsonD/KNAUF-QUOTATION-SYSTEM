import { Prisma, PrismaClient } from '@prisma/client';
import systemsData from '../src/data/knauf-systems.json';
import defaults from '../src/data/default-prices.json';
import { hashPassword } from '../src/lib/auth/password';
const db = new PrismaClient();
async function main() {
 for (const system of systemsData) {
  await db.knaufSystem.upsert({ where: { code: system.code }, update: { name: system.name, description: system.description, category: system.category, supportsDeflection: system.supportsDeflection }, create: { code: system.code, name: system.name, description: system.description, category: system.category, supportsDeflection: system.supportsDeflection } });
 }
 const existingNames=new Set((await db.masterProductPrice.findMany({select:{productName:true}})).map(row=>row.productName));
 const materials=systemsData.flatMap(system=>[...system.baseMaterials,...('deflectionMaterials' in system?system.deflectionMaterials??[]:[])]);
 const missing=Object.entries(defaults).filter(([name])=>!existingNames.has(name)).map(([productName,defaultPriceAed])=>({productName,defaultPriceAed,unit:materials.find(item=>item.productName===productName)?.unit||'pcs'}));
 if (missing.length) {
  try { await db.masterProductPrice.createMany({ data: missing }); }
  catch (error) {
   if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
   for (const item of missing) await db.masterProductPrice.upsert({ where: { productName: item.productName }, update: {}, create: item });
  }
 } // Provision an initial administrator only from explicitly configured environment values.
 // Never reset an existing password or reseed quotations during deployment.
 if (await db.user.count() === 0 && process.env.INITIAL_ADMIN_EMAIL && process.env.INITIAL_ADMIN_PASSWORD) {
  await db.user.create({ data: { email: process.env.INITIAL_ADMIN_EMAIL.toLowerCase(), name: 'Administrator', role: 'ADMIN', passwordHash: hashPassword(process.env.INITIAL_ADMIN_PASSWORD) } });
 }
 console.log('Catalog initialized without replacing existing prices, users or quotations.');
}
main().catch(()=>{ console.error('Database initialization failed. Check the connection and schema.');process.exitCode=1; }).finally(()=>db.$disconnect());
