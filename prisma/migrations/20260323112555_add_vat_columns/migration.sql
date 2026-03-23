-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "vat_type" TEXT;
ALTER TABLE "transactions" ADD COLUMN "vat_amount" INTEGER;
ALTER TABLE "transactions" ADD COLUMN "vat_rate" INTEGER DEFAULT 700;
ALTER TABLE "transactions" ADD COLUMN "subtotal" INTEGER;
ALTER TABLE "transactions" ADD COLUMN "merchant_tax_id" TEXT;
ALTER TABLE "transactions" ADD COLUMN "merchant_branch" TEXT;
ALTER TABLE "transactions" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE INDEX "transactions_vat_type_idx" ON "transactions"("vat_type");
