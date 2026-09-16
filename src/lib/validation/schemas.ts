import { z } from "zod";

// Accepts 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX, 2547XXXXXXXX
const KENYA_PHONE_RE = /^(?:\+?254|0)(7\d{8}|1\d{8})$/;

export const phoneSchema = z
  .string()
  .trim()
  .regex(KENYA_PHONE_RE, "Enter a valid Kenyan phone number, e.g. 0712345678");

// True file upload needs a storage backend (S3/Cloudinary/Vercel Blob) that
// isn't configured in this environment — see DEPLOYMENT.md. Until then,
// images are supplied as an https URL, validated here: must be a
// well-formed https URL, and — as a guard against someone linking a page
// instead of an image — end in a common image extension.
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i;
export const imageUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid image URL")
  .refine((url) => url.startsWith("https://"), "Image URL must use https://")
  .refine((url) => {
    try {
      return IMAGE_EXT_RE.test(new URL(url).pathname);
    } catch {
      return false;
    }
  }, "URL must point to a .png, .jpg, .webp or .gif file");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const businessRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  categoryId: z.string().min(1, "Select a category"),
  countyId: z.string().min(1, "Select a county"),
  location: z.string().trim().min(2).max(200),
  phone: phoneSchema,
  whatsapp: z.union([phoneSchema, z.literal("")]).optional(),
  description: z.string().trim().min(10, "Add a short description").max(2000),
  logoUrl: z.union([imageUrlSchema, z.literal("")]).optional(),
});

export const dealCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(2000),
    originalPrice: z.coerce.number().positive("Original price must be greater than 0"),
    dealPrice: z.coerce.number().positive("Deal price must be greater than 0"),
    categoryId: z.string().min(1, "Select a category"),
    countyId: z.string().min(1, "Select a county"),
    location: z.string().trim().min(2).max(200),
    expiryDate: z.coerce.date(),
    imageUrl: z.union([imageUrlSchema, z.literal("")]).optional(),
  })
  .refine((data) => data.dealPrice < data.originalPrice, {
    message: "Deal price must be lower than the original price",
    path: ["dealPrice"],
  })
  .refine((data) => data.expiryDate.getTime() > Date.now(), {
    message: "Expiry date must be in the future",
    path: ["expiryDate"],
  });

export const paymentSubmitSchema = z.object({
  packageId: z.string().min(1),
  transactionCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Enter the M-PESA transaction code")
    .max(20),
  dealId: z.string().optional(), // required for DEAL_BOOST / SPONSORED_DEAL
});

export const rejectionSchema = z.object({
  reason: z.string().trim().min(3, "Provide a reason").max(500),
});

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2).max(80),
  icon: z.string().trim().max(50).optional(),
  active: z.boolean().default(true),
});

export const countyUpsertSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(1).max(10),
  active: z.boolean().default(true),
});

export const packageUpsertSchema = z.object({
  type: z.enum([
    "BUSINESS_SUBSCRIPTION",
    "FEATURED_BUSINESS",
    "DEAL_BOOST",
    "SPONSORED_DEAL",
    "ADVERTISING",
  ]),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  durationDays: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
  active: z.boolean().default(true),
});

export const settingsUpdateSchema = z.object({
  mpesa_receiving_number: phoneSchema.optional().or(z.literal("")),
  payment_instructions: z.string().trim().max(2000).optional(),
  payment_receiving_status: z.enum(["ENABLED", "DISABLED"]).optional(),
  supported_payment_method_label: z.string().trim().max(100).optional(),
  brand_tagline: z.string().trim().max(200).optional(),
  max_active_deals_per_business: z.coerce.number().int().positive().optional(),
});
