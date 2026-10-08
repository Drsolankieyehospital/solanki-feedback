// Shared line-icons for the admin panel (stroke = currentColor).
export type IconName =
  | "grid"
  | "list"
  | "user"
  | "users"
  | "calendar"
  | "qr"
  | "badge"
  | "save"
  | "menu"
  | "x"
  | "logout";

const PATHS: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1.3" />
      <circle cx="3.5" cy="12" r="1.3" />
      <circle cx="3.5" cy="18" r="1.3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5S15 16.7 15 20" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M18 20c0-2.6-1-4.4-2.6-5.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2.5" x2="8" y2="6" />
      <line x1="16" y1="2.5" x2="16" y2="6" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="15.5" y="15.5" width="4" height="4" />
    </>
  ),
  badge: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="9" r="2.4" />
      <path d="M8 17c0-2 1.8-3.3 4-3.3s4 1.3 4 3.3" />
    </>
  ),
  save: (
    <>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v5h7" />
      <rect x="8" y="13" width="8" height="5" />
    </>
  ),
  menu: (
    <>
      <line x1="3.5" y1="7" x2="20.5" y2="7" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17" x2="20.5" y2="17" />
    </>
  ),
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 8l-4 4 4 4" />
      <line x1="6" y1="12" x2="16" y2="12" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-[18px] w-[18px]",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
