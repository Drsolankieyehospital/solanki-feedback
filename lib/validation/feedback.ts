import { z } from "zod";

// Shared source of truth for required fields — used by the form (client) and
// POST /api/feedback (server). Error messages are i18n *keys*; the UI maps them
// to the active language so one schema serves both languages.
const star = z
  .number({ invalid_type_error: "errRating", required_error: "errRating" })
  .int()
  .min(1, "errRating")
  .max(5, "errRating");

export const feedbackSchema = z.object({
  // patient details
  patient_name: z.string().trim().min(2, "errName").max(100, "errName"),
  mrd_number: z
    .string()
    .trim()
    .min(1, "errRequired")
    .max(30, "errRequired")
    // letters, digits, dash and slash (confirm real MRD format with hospital)
    .regex(/^[A-Za-z0-9/-]+$/, "errRequired")
    .transform((v) => v.toUpperCase()),
  mobile: z
    .string()
    .trim()
    // strip +91 / spaces / leading 0 before validating
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+?91|0)/, ""))
    .pipe(z.string().regex(/^[6-9][0-9]{9}$/, "errMobile")),
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errDate"),
  // Non-empty here; the server verifies the id exists and is active (Phase 4).
  opd_staff_id: z.string().min(1, "errStaff"),

  // star ratings (1-5)
  reception_rating: star,
  billing_rating: star,
  waiting_rating: star,
  doctor_rating: star,
  exam_rating: star,
  cleanliness_rating: star,
  pharmacy_rating: star,
  overall_rating: star,

  // choices
  consultant_info: z.enum(["yes", "no", "incomplete"], {
    errorMap: () => ({ message: "errChoice" }),
  }),
  staff_helpful: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "errChoice" }),
  }),
  would_recommend: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "errChoice" }),
  }),

  // free text (optional)
  employee_recognition: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
  suggestions: z.string().trim().max(2000).optional().or(z.literal("")),

  // meta
  language: z.enum(["en", "kn"]).default("en"),
  source: z.string().max(60).default("qr"),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;
export type FeedbackParsed = z.output<typeof feedbackSchema>;

// The server adds a Turnstile token + honeypot; kept separate from the DB shape.
export const feedbackRequestSchema = feedbackSchema.extend({
  turnstileToken: z.string().optional(),
  website: z.string().optional(), // honeypot — must be empty
});
