ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_positive_amount" CHECK ("amountCents" > 0);
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_positive_amount" CHECK ("amountCents" > 0);
CREATE UNIQUE INDEX "Category_common_name_unique" ON "Category" ("type", "normalizedName") WHERE "userId" IS NULL;
