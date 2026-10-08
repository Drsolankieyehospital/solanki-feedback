import QrPoster from "@/components/admin/qr/QrPoster";

export const dynamic = "force-dynamic";

export default function QrPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted print:hidden">
        Generate a printable poster for each location. All QR codes point to your
        own domain, so they never break.
      </p>
      <QrPoster />
    </div>
  );
}
