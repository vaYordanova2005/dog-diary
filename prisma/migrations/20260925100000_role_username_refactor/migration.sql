-- Remap the roles: VET -> DOCTOR, STAFF -> INTERN (ADMIN stays).
ALTER TYPE "Role" RENAME VALUE 'VET' TO 'DOCTOR';
ALTER TYPE "Role" RENAME VALUE 'STAFF' TO 'INTERN';

-- New accounts now start as INTERN, not DOCTOR.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'INTERN';

-- Login is now by username, not email. We rename the column to
-- keep the existing rows (no data loss).
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- Give the existing admin account a clean username.
UPDATE "User" SET "username" = 'admin' WHERE "username" = 'admin@dogdiary.local';
