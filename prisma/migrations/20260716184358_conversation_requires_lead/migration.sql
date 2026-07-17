/*
  כל שיחה נסובה סביב ליד — leadId הופך לחובה, ועמודות ההקשר הישנות
  (context/unitId/dealId) יורדות מהשיחה. הקשר להודעה בודדת נשאר ב-linkedEntity.
  שיחות הדמו הישנות נמחקות (ה-seed בונה מחדש).
  בנוסף יישור סחף: הזהות (name/email/phone) חיה על User, לא על Lead.
  הפקודות עמידות (IF EXISTS) — הריצה הראשונה הוחלה חלקית.
*/

-- שיחות המודל הישן נמחקות כולן (דאטת דמו); משתתפים והודעות בקסקדה
DELETE FROM "Conversation";

-- לידים מהמודל הישן שאין להם משתמש תואם (PK משותף) — נמחקים, ה-seed בונה מחדש
DELETE FROM "Lead" WHERE "id" NOT IN (SELECT "id" FROM "User");

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_dealId_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_leadId_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_unitId_fkey";

-- AlterTable
ALTER TABLE "Conversation"
  DROP COLUMN IF EXISTS "context",
  DROP COLUMN IF EXISTS "dealId",
  DROP COLUMN IF EXISTS "unitId";
ALTER TABLE "Conversation" ALTER COLUMN "leadId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lead"
  DROP COLUMN IF EXISTS "email",
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "phone";

-- DropEnum
DROP TYPE IF EXISTS "ConversationContextType";

-- AddForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_id_fkey";
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
