import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';
const base=process.env.AUTH_TEST_BASE_URL ?? 'http://127.0.0.1:3006';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'HTTP auth tests require a local server.');
assert.ok(process.env.DATABASE_URL?.replaceAll('\\','/').endsWith('/tmp/auth-security.db'),'Use only the isolated tmp/auth-security.db database.');
const db=new PrismaClient();
const email='auth-test@example.test';const password=crypto.randomBytes(20).toString('base64url');
const call=(path:string,body?:unknown,cookie?:string,origin?:string)=>fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
const cookieOf=(r:Response)=>r.headers.get('set-cookie')!.split(';')[0];
async function main(){
 await db.authRateLimit.deleteMany();await db.user.deleteMany({where:{email}});const user=await db.user.create({data:{email,name:'Isolated auth test',role:'ADMIN',passwordHash:hashPassword(password)}});
 for(const p of ['/api/catalog','/api/quotes','/api/quotes/not-a-real-id','/api/quotes/not-a-real-id/pdf','/api/quotes/not-a-real-id/export'])assert.equal((await call(p)).status,401,p);
 for(const p of ['/api/calculate','/api/quotes','/api/quotes/pdf','/api/catalog','/api/auth/password'])assert.equal((await call(p,{})).status,401,p);
 for(const p of ['/','/quotes/new','/catalog','/account/password']){const r=await call(p);assert.equal(r.status,307,p);assert.equal(r.headers.get('location'),'/login');}
 assert.equal((await call('/api/auth/login',{email,password},undefined,'https://attacker.example')).status,403);
 assert.equal((await call('/api/auth/login',{email:{bad:true},password})).status,400);
 const wrong=await call('/api/auth/login',{email,password:'wrong'});assert.equal(wrong.status,401);
 const unknown=await call('/api/auth/login',{email:'missing@example.test',password:'wrong'});assert.equal(unknown.status,401);assert.deepEqual(await unknown.json(),await wrong.json());
 const login=await call('/api/auth/login',{email:email.toUpperCase(),password});assert.equal(login.status,200);const a=cookieOf(login);assert.match(login.headers.get('set-cookie')!,/HttpOnly/);assert.match(login.headers.get('set-cookie')!,/SameSite=lax/i);assert.ok(a.split('=')[1].length===64);assert.equal((await(await call('/api/auth/me',undefined,a)).json()).user.role,'ADMIN');assert.equal((await call('/api/catalog',undefined,a)).status,200);
 const tampered=a.slice(0,-1)+(a.endsWith('a')?'b':'a');assert.equal((await call('/api/catalog',undefined,tampered)).status,401);
 const second=await call('/api/auth/login',{email,password});const b=cookieOf(second);
 await db.user.update({where:{id:user.id},data:{role:'VIEWER'}});assert.equal((await(await call('/api/auth/me',undefined,a)).json()).user.role,'VIEWER');assert.equal((await call('/api/catalog',{productName:'Unauthorized',priceAed:1},a)).status,403);await db.user.update({where:{id:user.id},data:{role:'ADMIN'}});
 assert.equal((await call('/api/auth/password',{currentPassword:'wrong',newPassword:'a different long passphrase'},a)).status,401);
 assert.equal((await call('/api/auth/password',{currentPassword:password,newPassword:'short'},a)).status,400);
 assert.equal((await call('/api/auth/password',{currentPassword:password,newPassword:'xxxxxxxxxxxxxxxx'},a)).status,400);
 const newer=crypto.randomBytes(22).toString('base64url');const changed=await call('/api/auth/password',{currentPassword:password,newPassword:newer},a);assert.equal(changed.status,200);const c=cookieOf(changed);for(const old of [a,b])assert.equal((await call('/api/catalog',undefined,old)).status,401);assert.equal((await call('/api/catalog',undefined,c)).status,200);const staleToken=crypto.randomBytes(32).toString('hex');await db.authSession.create({data:{tokenHash:crypto.createHash('sha256').update(staleToken).digest('hex'),userId:user.id,sessionVersion:0,expiresAt:new Date(Date.now()+3600000)}});assert.equal((await call('/api/catalog',undefined,'alnamariq_session='+staleToken)).status,401);assert.equal((await call('/api/auth/login',{email,password})).status,401);
 await db.authSession.updateMany({where:{userId:user.id},data:{lastSeenAt:new Date(Date.now()-31*60*1000)}});assert.equal((await call('/api/catalog',undefined,c)).status,401);
 const fresh=await call('/api/auth/login',{email,password:newer});const d=cookieOf(fresh);const logout=await call('/api/auth/logout',{},d);assert.equal(logout.status,200);assert.equal((await call('/api/catalog',undefined,d)).status,401);
 const expired=await call('/api/auth/login',{email,password:newer});const e=cookieOf(expired);await db.authSession.updateMany({where:{userId:user.id},data:{expiresAt:new Date(Date.now()-1000)}});assert.equal((await call('/api/catalog',undefined,e)).status,401);
 for(let n=0;n<10;n++)assert.equal((await call('/api/auth/login',{email:'limit-test@example.test',password:'wrong'})).status,401);const limited=await call('/api/auth/login',{email:'limit-test@example.test',password:'wrong'});assert.equal(limited.status,429);assert.ok(Number(limited.headers.get('retry-after'))>0);
 for(let n=0;n<30;n++)assert.equal((await call('/api/auth/login',{email:'limit-test@example.test',password:'wrong'})).status,429);const before=await db.authRateLimit.count();for(let n=0;n<5;n++)assert.equal((await call('/api/auth/login',{email:`random-${n}@example.test`,password:'wrong'})).status,429);assert.equal(await db.authRateLimit.count(),before);
 console.log('Isolated HTTP auth tests passed: private pages/APIs, valid and invalid login, origin rejection, role changes, tampering, password change, session revocation/expiry, logout and durable login throttling.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{await db.user.deleteMany({where:{email}});await db.$disconnect();});
