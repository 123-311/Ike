-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('BUSINESS_SUBSCRIPTION', 'FEATURED_BUSINESS', 'DEAL_BOOST', 'SPONSORED_DEAL', 'ADVERTISING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdPlacementType" AS ENUM ('HOMEPAGE_BANNER', 'CATEGORY_BANNER', 'SPONSORED_CARD', 'PROMOTIONAL_PLACEMENT');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('DISABLED', 'PENDING', 'CONFIRMED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "County" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "dealPrice" DECIMAL(12,2) NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "savings" DECIMAL(12,2) NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedDeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionPackage" (
    "id" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "mpesaReceivingNumber" TEXT NOT NULL,
    "transactionCode" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedBusiness" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isAdminException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionReason" TEXT,
    "exceptionGrantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealBoost" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsoredDeal" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "placement" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsoredDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisingPlacement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "placement" "AdPlacementType" NOT NULL,
    "creativeUrl" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedById" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertisingPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralEvent" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredBusinessId" TEXT NOT NULL,
    "commissionAmount" DECIMAL(12,2),
    "status" "ReferralStatus" NOT NULL DEFAULT 'DISABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "County_name_key" ON "County"("name");

-- CreateIndex
CREATE UNIQUE INDEX "County_code_key" ON "County"("code");

-- CreateIndex
CREATE INDEX "Business_verificationStatus_idx" ON "Business"("verificationStatus");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "Business_categoryId_idx" ON "Business"("categoryId");

-- CreateIndex
CREATE INDEX "Business_countyId_idx" ON "Business"("countyId");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "Deal_businessId_idx" ON "Deal"("businessId");

-- CreateIndex
CREATE INDEX "Deal_expiryDate_idx" ON "Deal"("expiryDate");

-- CreateIndex
CREATE INDEX "Deal_categoryId_idx" ON "Deal"("categoryId");

-- CreateIndex
CREATE INDEX "Deal_countyId_idx" ON "Deal"("countyId");

-- CreateIndex
CREATE INDEX "SavedDeal_userId_idx" ON "SavedDeal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedDeal_userId_dealId_key" ON "SavedDeal"("userId", "dealId");

-- CreateIndex
CREATE INDEX "PromotionPackage_type_active_idx" ON "PromotionPackage"("type", "active");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_businessId_idx" ON "Payment"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionCode_key" ON "Payment"("transactionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentId_key" ON "Subscription"("paymentId");

-- CreateIndex
CREATE INDEX "Subscription_businessId_status_idx" ON "Subscription"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBusiness_paymentId_key" ON "FeaturedBusiness"("paymentId");

-- CreateIndex
CREATE INDEX "FeaturedBusiness_businessId_status_idx" ON "FeaturedBusiness"("businessId", "status");

-- CreateIndex
CREATE INDEX "FeaturedBusiness_status_endDate_idx" ON "FeaturedBusiness"("status", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "DealBoost_paymentId_key" ON "DealBoost"("paymentId");

-- CreateIndex
CREATE INDEX "DealBoost_dealId_status_idx" ON "DealBoost"("dealId", "status");

-- CreateIndex
CREATE INDEX "DealBoost_status_endDate_idx" ON "DealBoost"("status", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "SponsoredDeal_paymentId_key" ON "SponsoredDeal"("paymentId");

-- CreateIndex
CREATE INDEX "SponsoredDeal_status_endDate_idx" ON "SponsoredDeal"("status", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisingPlacement_paymentId_key" ON "AdvertisingPlacement"("paymentId");

-- CreateIndex
CREATE INDEX "AdvertisingPlacement_placement_status_idx" ON "AdvertisingPlacement"("placement", "status");

-- CreateIndex
CREATE INDEX "AdvertisingPlacement_status_endDate_idx" ON "AdvertisingPlacement"("status", "endDate");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDeal" ADD CONSTRAINT "SavedDeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDeal" ADD CONSTRAINT "SavedDeal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedBusiness" ADD CONSTRAINT "FeaturedBusiness_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedBusiness" ADD CONSTRAINT "FeaturedBusiness_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedBusiness" ADD CONSTRAINT "FeaturedBusiness_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealBoost" ADD CONSTRAINT "DealBoost_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealBoost" ADD CONSTRAINT "DealBoost_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealBoost" ADD CONSTRAINT "DealBoost_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredDeal" ADD CONSTRAINT "SponsoredDeal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredDeal" ADD CONSTRAINT "SponsoredDeal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredDeal" ADD CONSTRAINT "SponsoredDeal_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredDeal" ADD CONSTRAINT "SponsoredDeal_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingPlacement" ADD CONSTRAINT "AdvertisingPlacement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingPlacement" ADD CONSTRAINT "AdvertisingPlacement_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingPlacement" ADD CONSTRAINT "AdvertisingPlacement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referredBusinessId_fkey" FOREIGN KEY ("referredBusinessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
