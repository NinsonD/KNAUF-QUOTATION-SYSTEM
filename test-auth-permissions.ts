import { hashPassword, verifyPassword } from './src/lib/auth/password';
import { signSession, verifySessionToken } from './src/lib/auth/session';
import {
  canManagePrices,
  canCreateQuote,
  canEditQuoteItems,
  canDeleteQuote,
  canExportQuote,
  AuthUser,
} from './src/lib/auth/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== STARTING RBAC AUTH & PERMISSIONS TESTS ===\n');

  // TEST 1: Password Hash & Verification
  console.log('[TEST 1] Password Hashing & Timing-safe Verification:');
  const rawPass = 'AlNamariq@2026';
  const hashed = hashPassword(rawPass);
  const isValid = verifyPassword(rawPass, hashed);
  const isInvalid = verifyPassword('WrongPassword', hashed);
  console.log(`  - Hash generated: ${hashed.slice(0, 30)}...`);
  console.log(`  - Correct password verified: ${isValid}`);
  console.log(`  - Incorrect password rejected: ${!isInvalid}`);
  if (!isValid || isInvalid) throw new Error('Password verification failed');

  // TEST 2: Session Token Signature & Verification
  console.log('\n[TEST 2] Cryptographic Session Signature:');
  const testUser: AuthUser = {
    id: 'usr_test_123',
    email: 'test@alnamariq.ae',
    name: 'Test Estimator',
    role: 'ESTIMATOR',
  };
  const token = signSession(testUser);
  const decoded = verifySessionToken(token);
  console.log(`  - Token generated: ${token.slice(0, 35)}...`);
  console.log(`  - Decoded userId matches: ${decoded?.userId === testUser.id}`);
  console.log(`  - Decoded role matches: ${decoded?.role === 'ESTIMATOR'}`);
  if (decoded?.role !== 'ESTIMATOR') throw new Error('Session token verification failed');

  // TEST 3: Permission Matrix Validation
  console.log('\n[TEST 3] Permission Matrix Enforcement:');
  console.log(`  - ADMIN canManagePrices: ${canManagePrices('ADMIN')} (expected true)`);
  console.log(`  - ESTIMATOR canManagePrices: ${canManagePrices('ESTIMATOR')} (expected false)`);
  console.log(`  - SALES canManagePrices: ${canManagePrices('SALES')} (expected false)`);
  console.log(`  - VIEWER canManagePrices: ${canManagePrices('VIEWER')} (expected false)`);

  console.log(`  - ADMIN canDeleteQuote: ${canDeleteQuote('ADMIN')} (expected true)`);
  console.log(`  - ESTIMATOR canDeleteQuote: ${canDeleteQuote('ESTIMATOR')} (expected false)`);
  console.log(`  - SALES canDeleteQuote: ${canDeleteQuote('SALES')} (expected false)`);

  console.log(`  - ESTIMATOR canEditQuoteItems: ${canEditQuoteItems('ESTIMATOR')} (expected true)`);
  console.log(`  - SALES canEditQuoteItems: ${canEditQuoteItems('SALES')} (expected false)`);
  console.log(`  - VIEWER canCreateQuote: ${canCreateQuote('VIEWER')} (expected false)`);
  console.log(`  - VIEWER canExportQuote: ${canExportQuote('VIEWER')} (expected true)`);

  if (!canManagePrices('ADMIN') || canManagePrices('ESTIMATOR')) {
    throw new Error('canManagePrices logic mismatch');
  }
  if (!canDeleteQuote('ADMIN') || canDeleteQuote('SALES')) {
    throw new Error('canDeleteQuote logic mismatch');
  }
  if (!canEditQuoteItems('ESTIMATOR') || canEditQuoteItems('SALES')) {
    throw new Error('canEditQuoteItems logic mismatch');
  }

  // TEST 4: Database Users & Role Verification
  console.log('\n[TEST 4] Seeded Database Users & Logins:');
  const accounts = [
    { email: 'admin@alnamariq.ae', pass: 'Admin@1234', expectedRole: 'ADMIN' },
    { email: 'estimator@alnamariq.ae', pass: 'Estimator@1234', expectedRole: 'ESTIMATOR' },
    { email: 'sales@alnamariq.ae', pass: 'Sales@1234', expectedRole: 'SALES' },
    { email: 'viewer@alnamariq.ae', pass: 'Viewer@1234', expectedRole: 'VIEWER' },
  ];

  for (const acc of accounts) {
    const dbUser = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!dbUser) throw new Error(`User not found in database: ${acc.email}`);
    const passMatches = verifyPassword(acc.pass, dbUser.passwordHash);
    console.log(`  - ${acc.email} (${dbUser.role}): Password match = ${passMatches}, Role match = ${dbUser.role === acc.expectedRole}`);
    if (!passMatches || dbUser.role !== acc.expectedRole) {
      throw new Error(`Credential or role mismatch for ${acc.email}`);
    }
  }

  console.log('\n=== ALL RBAC AUTH TESTS PASSED SUCCESSFULLY ===');
}

runTests()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

