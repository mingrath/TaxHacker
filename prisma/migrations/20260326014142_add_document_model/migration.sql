-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contact_id" UUID,
    "issued_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "payment_terms" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "vat_rate" INTEGER NOT NULL DEFAULT 0,
    "vat_amount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL DEFAULT '[]',
    "seller_data" JSONB,
    "buyer_data" JSONB,
    "source_document_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "documents_document_type_idx" ON "documents"("document_type");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_contact_id_idx" ON "documents"("contact_id");

-- CreateIndex
CREATE INDEX "documents_source_document_id_idx" ON "documents"("source_document_id");

-- CreateIndex
CREATE INDEX "documents_issued_at_idx" ON "documents"("issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "documents_user_id_document_number_key" ON "documents"("user_id", "document_number");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
