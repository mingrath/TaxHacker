-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "paid_amount" INTEGER,
ADD COLUMN     "payment_date" TIMESTAMP(3),
ADD COLUMN     "payment_method" TEXT;
