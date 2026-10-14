import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { hashPassword, hashPasswordAsync, verifyPassword, verifyPasswordAsync, passwordNeedsRehash } from '../src/lib/auth/password';
import { canCreateQuote, canDeleteQuote, canManagePrices, canExportQuote } from '../src/lib/auth/permissions';
async function main() {
 const password = 'unit test passphrase with spaces';
 const a = hashPassword(password), b = await hashPasswordAsync(password);
 assert.notEqual(a,b); assert.ok(verifyPassword(password,a)); assert.ok(await verifyPasswordAsync(password,b)); assert.ok(!(await verifyPasswordAsync('incorrect',b))); assert.ok(!passwordNeedsRehash(b));
 const salt = crypto.randomBytes(16).toString('hex'); const old = salt + ':' + crypto.pbkdf2Sync(password,salt,100000,64,'sha512').toString('hex');
 assert.ok(await verifyPasswordAsync(password,old)); assert.ok(passwordNeedsRehash(old));
 for(const bad of ['', 'x:y', 'pbkdf2-sha512$999999999$x$y', a+'$extra'])assert.equal(await verifyPasswordAsync(password,bad),false);
 assert.ok(canDeleteQuote('ADMIN'));assert.ok(!canDeleteQuote('ESTIMATOR'));assert.ok(!canCreateQuote('VIEWER'));assert.ok(!canManagePrices('SALES'));assert.ok(canExportQuote('VIEWER'));
 console.log('Password upgrade, invalid hash handling and role permission tests passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
