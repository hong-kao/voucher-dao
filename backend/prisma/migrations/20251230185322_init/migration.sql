-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "VoucherMeta" (
    "id" SERIAL NOT NULL,
    "token_id" INTEGER NOT NULL,
    "store" TEXT NOT NULL,
    "face_value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expiry_date" TIMESTAMP(3),
    "image_url" TEXT,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" SERIAL NOT NULL,
    "on_chain_id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "token_id" INTEGER NOT NULL,
    "claim_code" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoucherMeta_token_id_key" ON "VoucherMeta"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_on_chain_id_key" ON "Redemption"("on_chain_id");
