import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { feedbackRequestSchema, MAX_PER_DEVICE } from "@/lib/validation/feedback";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  clientIp,
  hashIp,
  hashDevice,
  withinRateLimit,
  deviceSubmissionCount,
} from "@/lib/rate-limit";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";

const DEVICE_COOKIE = "fbdev";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

/**
 * POST /api/feedback — the ONLY write path for patient data.
 * 1. honeypot  2. Turnstile  3. IP rate limit  4. Zod validation
 * 5. per-device limit  6. active-staff check  7. insert with service role.
 */
export async function POST(req: Request) {
  // Device cookie: reuse if present, else mint a new one and set it on the reply.
  const cookieStore = await cookies();
  let deviceCookie = cookieStore.get(DEVICE_COOKIE)?.value;
  if (!deviceCookie) deviceCookie = randomUUID();

  const withCookie = (body: object, status = 200) => {
    const res = NextResponse.json(body, { status });
    res.cookies.set(DEVICE_COOKIE, deviceCookie!, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  };

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return withCookie({ ok: false, error: "bad_request" }, 400);
  }

  // 1. Honeypot — a filled hidden field means a bot. Pretend success, don't store.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return withCookie({ ok: true });
  }

  // 4. Validate (also normalises mobile + MRD).
  const parsed = feedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return withCookie({ ok: false, error: "invalid", fieldErrors }, 422);
  }

  const ip = clientIp(req.headers);

  // 2. Turnstile (skipped automatically if not configured).
  const human = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!human) return withCookie({ ok: false, error: "turnstile" }, 403);

  const {
    website: _hp,
    turnstileToken: _tt,
    deviceId: localDeviceId,
    ...data
  } = parsed.data;
  void _hp;
  void _tt;

  const deviceHash = hashDevice(deviceCookie);
  const clientHash = localDeviceId ? hashDevice(localDeviceId) : null;

  // Dev affordance: before Supabase is wired, accept + acknowledge without
  // storing so the full submit → thank-you flow is demoable locally.
  if (!isSupabaseConfigured()) {
    console.warn("[feedback] Supabase not configured — submission not stored.");
    return withCookie({ ok: true, stored: false });
  }

  const supabase = createServiceClient();
  const ipHash = hashIp(ip);

  // 5. Per-device limit (cookie + localStorage). Not keyed on IP, since
  // patients share hospital WiFi.
  const deviceCount = await deviceSubmissionCount(
    supabase,
    [deviceHash, clientHash].filter(Boolean) as string[],
  );
  if (deviceCount >= MAX_PER_DEVICE) {
    return withCookie({ ok: false, error: "device_limit" }, 429);
  }

  // 3. Rate limit: max 5 per IP hash / 10 min (anti-burst).
  if (!(await withinRateLimit(supabase, ipHash))) {
    return withCookie({ ok: false, error: "rate_limited" }, 429);
  }

  // 6. Staff must exist and be active.
  const { data: staff } = await supabase
    .from("opd_staff")
    .select("id")
    .eq("id", data.opd_staff_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff) return withCookie({ ok: false, error: "bad_staff" }, 422);

  // 7. Insert.
  const { error } = await supabase.from("feedback").insert({
    ...data,
    employee_recognition: data.employee_recognition || null,
    suggestions: data.suggestions || null,
    ip_hash: ipHash,
    device_hash: deviceHash,
    client_hash: clientHash,
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    return withCookie({ ok: false, error: "server" }, 500);
  }

  return withCookie({ ok: true, stored: true });
}
