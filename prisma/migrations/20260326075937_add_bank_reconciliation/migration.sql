-- CreateTable
CREATE TABLE "bank_statements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT,
    "filename" TEXT NOT NULL,
    "file_hash" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'imported',
    "total_entries" INTEGER NOT NULL DEFAULT 0,
    "matched_entries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_entries" (
    "id" UUID NOT NULL,
    "statement_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "deposit" INTEGER,
    "withdrawal" INTEGER,
    "balance" INTEGER,
    "reference" TEXT,
    "match_status" TEXT NOT NULL DEFAULT 'unmatched',
    "transaction_id" UUID,
    "match_score" INTEGER,
    "match_reasons" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_statements_user_id_idx" ON "bank_statements"("user_id");

-- CreateIndex
CREATE INDEX "bank_entries_statement_id_idx" ON "bank_entries"("statement_id");

-- CreateIndex
CREATE INDEX "bank_entries_match_status_idx" ON "bank_entries"("match_status");

-- CreateIndex
CREATE INDEX "bank_entries_date_idx" ON "bank_entries"("date");

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_entries" ADD CONSTRAINT "bank_entries_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
