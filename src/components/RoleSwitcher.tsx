import { useAuth, type ViewAs } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { Shield, User as UserIcon, Eye, X } from "lucide-react";
import { useState } from "react";

const OPTIONS: { value: ViewAs; label: string; Icon: typeof Shield }[] = [
  { value: "admin", label: "Admin", Icon: Shield },
  { value: "customer", label: "Customer", Icon: UserIcon },
  { value: "visitor", label: "Visitor", Icon: Eye },
];

/**
 * Floating impersonation switcher. Visible only to real admins.
 * UI-only — RLS still enforces real permissions on the server.
 */
export function RoleSwitcher() {
  const { isAdmin, viewAs, setViewAs, isImpersonating, exitImpersonation } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  if (!isAdmin) return null;

  const goToRole = (value: ViewAs) => {
    setViewAs(value);
    navigate({ to: value === "admin" ? "/admin" : value === "customer" ? "/portal" : "/" });
  };

  const exitAndReturn = () => {
    exitImpersonation();
    navigate({ to: "/admin" });
  };

  return (
    <>
      {isImpersonating && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-xs font-semibold text-amber-950 shadow-md">
          <span>
            Viewing as <span className="uppercase">{viewAs}</span> — UI only, your admin permissions still apply.
          </span>
          <button
            onClick={exitAndReturn}
            className="inline-flex items-center gap-1 rounded-full bg-amber-950/10 px-3 py-1 transition hover:bg-amber-950/20"
          >
            <X className="h-3 w-3" /> Exit
          </button>
        </div>
      )}

      <div
        className={`fixed bottom-4 right-4 z-[60] rounded-2xl border border-border bg-card/95 p-1.5 shadow-pop backdrop-blur ${
          isImpersonating ? "ring-2 ring-amber-500" : ""
        }`}
      >
        {open ? (
          <div className="flex items-center gap-1">
            {OPTIONS.map(({ value, label, Icon }) => {
              const active = viewAs === value;
              return (
                <button
                  key={value}
                  onClick={() => goToRole(value)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-pop"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={active}
                  title={`View as ${label}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => setOpen(false)}
              className="ml-1 rounded-xl px-2 py-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Hide switcher"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
          >
            <Shield className="h-3.5 w-3.5" /> Dev
          </button>
        )}
      </div>
    </>
  );
}
