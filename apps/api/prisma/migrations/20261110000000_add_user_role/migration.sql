-- Auth portion of BrewLite migration 20261020000000_add_staff_and_promotions.
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STAFF');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';