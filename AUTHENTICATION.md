# Authentication

The production app requires login for quotation pages, catalog prices, calculations, quotation APIs and PDF/Excel downloads. Role permissions continue to govern changes and deletion. Browser mutations reject cross-site origins.

Login accepts bounded JSON fields and gives the same invalid-credential response for unknown users and wrong passwords. Shared database counters allow 10 account attempts and 30 IP attempts per 15-minute window, including successful attempts. Vercel-supplied IP headers are used only when running on Vercel; direct local testing uses one shared local bucket. Expired counter/session records are cleaned during login. Blocked IPs cannot create unlimited new account-counter keys.

Sessions use 256-bit random opaque tokens. Only SHA256 token digests are stored in the database. Cookies are HttpOnly, SameSite=Lax, Secure in production, and expire after 8 hours. Server-side sessions also expire after 30 minutes of inactivity. Account role and session version are checked on every authenticated request. Logout revokes the server record; password changes revoke all other sessions and increment the account's session version. Previous signed-cookie sessions are deliberately no longer accepted, so users must sign in once after this update.

Passwords use salted PBKDF2-HMAC-SHA512 at 220,000 iterations. Existing 100,000-iteration hashes continue working and upgrade on successful login without changing the password. Authentication uses asynchronous derivation and timing-safe comparison. Older hashes perform additional derivation work to keep verification work comparable to current hashes. No credentials or password hashes are returned in API bodies or stored in browser storage.

Users change their own password through Account menu > Change password. This requires the current password and a different 15–128-character new password; blank or repeated-character passwords are rejected. Existing production passwords are retained by explicit user request. There is no automatic password reset or password rotation. Demo seeding is restricted to SQLite and preserves existing user passwords and roles.

Verification: `npm run test:auth` covers hash compatibility, upgrades, malformed hashes and permissions. `npm run test:auth:http` requires a local preview and a DATABASE_URL ending in `/tmp/auth-security.db`; it refuses production hosts/databases. Its synthetic account tests authenticated/anonymous APIs and pages, origin rejection, roles, password changes, stale-session versions, tampering, logout, idle/absolute expiry and shared rate limiting. It never changes production credentials.

This is password-based authentication; MFA and emailed recovery are not configured. Production needs its private AUTH_SECRET for privacy-preserving limiter keys. Credentials are supplied to the owner separately, never in this document.
