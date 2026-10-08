import { NextResponse } from "next/server";
import { feedbackRequestSchema } from "@/lib/validation/feedback";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp, hashIp, withinRateLimit } from "@/lib/rate-limit";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/feedback — the ONLY write path for patient data.
 * 1. honeypot  2. Turnstile  3. rate limit  4. Zod validation
 * 5. active-staff check  6. insert with service role. Returns { ok: true } only.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // 1. Honeypot — a filled hidden field means a bot. Pretend success, don't store.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // 4. Validate (also normalises mobile + MRD).
  const parsed = feedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { ok: false, error: "invalid", fieldErrors },
      { status: 422 },
    );
  }

  const ip = clientIp(req.headers);

  // 2. Turnstile (skipped automatically if not configured).
  const human = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!human) {
    return NextResponse.json({ ok: false, error: "turnstile" }, { status: 403 });
  }

  const { website: _hp, turnstileToken: _tt, ...data } = parsed.data;
  void _hp;
  void _tt;

  // Dev affordance: before Supabase is wired, accept + acknowledge without
  // storing so the full submit → thank-you flow is demoable locally.
  if (!isSupabaseConfigured()) {
    console.warn("[feedback] Supabase not configured — submission not stored.");
    return NextResponse.json({ ok: true, stored: false });
  }

  const supabase = createServiceClient();
  const ipHash = hashIp(ip);

  // 3. Rate limit: max 5 per IP hash / 10 min.
  if (!(await withinRateLimit(supabase, ipHash))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // 5. Staff must exist and be active.
  const { data: staff } = await supabase
    .from("opd_staff")
    .select("id")
    .eq("id", data.opd_staff_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff) {
    return NextResponse.json({ ok: false, error: "bad_staff" }, { status: 422 });
  }

  // 6. Insert.
  const { error } = await supabase.from("feedback").insert({
    ...data,
    employee_recognition: data.employee_recognition || null,
    suggestions: data.suggestions || null,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
