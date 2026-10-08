import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { getActiveStaff } from "@/lib/staff";

// Patient feedback form. QR codes land here (optionally with ?src=<location>).
export const dynamic = "force-dynamic";

export default async function Home() {
  const staff = await getActiveStaff();
  return (
    <LanguageProvider>
      <main className="min-h-dvh bg-canvas">
        <FeedbackForm staff={staff} />
      </main>
    </LanguageProvider>
  );
}
