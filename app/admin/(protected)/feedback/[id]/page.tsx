import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeedbackDetail, maskMobile } from "@/lib/feedback-list";
import { getAdmin } from "@/lib/auth";
import { QUESTIONS } from "@/lib/questions";
import { en } from "@/lib/i18n/en";
import { formatIST } from "@/lib/dates";
import { Card, CardHead, Stars, StatusPill } from "@/components/admin/ui";
import StatusEditor from "@/components/admin/feedback/StatusEditor";
import PrintButton from "@/components/admin/feedback/PrintButton";

export const dynamic = "force-dynamic";

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, admin] = await Promise.all([getFeedbackDetail(id), getAdmin()]);
  if (!detail) notFound();
  const isViewer = admin?.role !== "admin";

  const fieldValue = (field: string) =>
    (detail as unknown as Record<string, unknown>)[field];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link
          href="/admin/feedback"
          className="text-[13px] font-semibold text-primary"
        >
          ← Back to list
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <StatusPill status={detail.status} />
          <PrintButton />
        </div>
      </div>

      {/* patient */}
      <Card>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div>
            <div className="font-display text-xl font-semibold text-ink">
              {detail.patient_name}
            </div>
            <div className="mt-0.5 text-[13px] text-muted">
              MRD {detail.mrd_number} ·{" "}
              {isViewer ? maskMobile(detail.mobile) : detail.mobile}
            </div>
          </div>
          {!isViewer && (
            <div className="flex gap-2">
              <a
                href={`tel:${detail.mobile}`}
                className="rounded-field border border-divider bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink print:hidden"
              >
                Call
              </a>
              <a
                href={`https://wa.me/91${detail.mobile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-field border border-divider bg-surface px-3.5 py-2 text-[13px] font-semibold text-ok print:hidden"
              >
                WhatsApp
              </a>
            </div>
          )}
          <div className="ml-auto text-right text-[12px] text-muted">
            <div>Visit: {detail.visit_date}</div>
            <div>Submitted: {formatIST(detail.created_at)}</div>
            <div>
              Language: {detail.language === "kn" ? "ಕನ್ನಡ" : "English"} · Source:{" "}
              {detail.source}
            </div>
            <div>OPD staff: {detail.staff_name}</div>
          </div>
        </div>
      </Card>

      {/* answers */}
      <Card>
        <CardHead title="Responses" />
        <div className="flex flex-col divide-y divide-divider">
          {QUESTIONS.map((q) => {
            const v = fieldValue(q.field);
            return (
              <div key={q.field} className="flex items-start gap-3 py-3">
                <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-md bg-primary-tint text-[11px] font-bold text-primary">
                  {q.n}
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] text-ink">
                  {en[q.labelKey] as string}
                </span>
                <span className="flex-none text-right text-[13.5px] font-semibold text-ink">
                  {q.type === "star" && <Stars value={(v as number) || 0} />}
                  {q.type === "choice" &&
                    (v
                      ? (en[v as "yes" | "no" | "incomplete"] as string)
                      : "—")}
                  {q.type === "text" && (
                    <span className="font-normal text-muted">
                      {(v as string) || "—"}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {detail.suggestions && (
          <div className="mt-4 rounded-field border border-divider bg-canvas p-3.5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Suggestion to improve
            </div>
            <p className="text-[13.5px] text-ink">{detail.suggestions}</p>
          </div>
        )}
      </Card>

      {/* status + notes */}
      <Card className="print:hidden">
        <CardHead title="Review" />
        <StatusEditor
          id={detail.id}
          status={detail.status}
          notes={detail.admin_notes}
        />
      </Card>

      {/* same-MRD history */}
      {detail.history.length > 0 && (
        <Card className="print:hidden">
          <CardHead title={`Other visits for MRD ${detail.mrd_number}`} />
          <div className="flex flex-col divide-y divide-divider">
            {detail.history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                <span className="w-28 text-muted tabular-nums">{h.visit_date}</span>
                <Stars value={h.overall_rating} />
                <span className="ml-auto">
                  <StatusPill status={h.status} />
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
