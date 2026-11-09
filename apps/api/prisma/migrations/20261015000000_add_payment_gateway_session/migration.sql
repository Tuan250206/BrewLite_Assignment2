DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'PaymentStatus'
          AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
    END IF;
END
$$;

ALTER TABLE "Payment"
    ADD COLUMN IF NOT EXISTS "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS "confirmationTokenHash" TEXT,
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "providerTransactionId" TEXT,
    ADD COLUMN IF NOT EXISTS "gatewayPaymentUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "testAccount" TEXT,
    ADD COLUMN IF NOT EXISTS "testCredentialHash" TEXT;

CREATE INDEX IF NOT EXISTS "Payment_confirmationTokenHash_idx"
    ON "Payment"("confirmationTokenHash");

CREATE INDEX IF NOT EXISTS "Payment_providerTransactionId_idx"
    ON "Payment"("providerTransactionId");
