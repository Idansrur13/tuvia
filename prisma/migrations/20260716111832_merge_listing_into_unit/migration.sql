/*
  Warnings:

  - You are about to drop the column `city` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `cover` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `gallery` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `listingId` on the `Viewing` table. All the data in the column will be lost.
  - You are about to drop the `Listing` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agentId` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agentRole` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availability` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dealType` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Viewing" DROP CONSTRAINT "Viewing_listingId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "cover",
DROP COLUMN "gallery",
DROP COLUMN "lat",
DROP COLUMN "lng",
DROP COLUMN "neighborhood",
DROP COLUMN "street";

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "name",
ADD COLUMN     "agentId" TEXT NOT NULL,
ADD COLUMN     "agentRole" "AgentRole" NOT NULL,
ADD COLUMN     "availability" "ListingAvailability" NOT NULL,
ADD COLUMN     "badge" JSONB,
ADD COLUMN     "category" "ListingCategory" NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" JSONB NOT NULL,
ADD COLUMN     "dealType" "DealType" NOT NULL,
ADD COLUMN     "description" JSONB NOT NULL,
ADD COLUMN     "entry" TEXT,
ADD COLUMN     "features" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "parking" INTEGER,
ADD COLUMN     "publishedToMarketplace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "title" JSONB NOT NULL,
ADD COLUMN     "yearBuilt" INTEGER,
ALTER COLUMN "priceAmount" DROP NOT NULL,
ALTER COLUMN "priceCurrency" DROP NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Viewing" DROP COLUMN "listingId";

-- DropTable
DROP TABLE "Listing";

-- CreateIndex
CREATE INDEX "Unit_publishedToMarketplace_dealType_category_city_idx" ON "Unit"("publishedToMarketplace", "dealType", "category", "city");

-- CreateIndex
CREATE INDEX "Unit_priceAmount_idx" ON "Unit"("priceAmount");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
