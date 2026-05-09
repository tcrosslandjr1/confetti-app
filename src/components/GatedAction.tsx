import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type Props = {
  to: string;
  children: ReactNode;
  className?: string;
  /** Friendly label for the toast prompt — defaults to "this feature". */
  feature?: string;
};

/**
 * A Link that's gated behind authentication. Visitors get a toast prompting
 * them to sign up and are sent to /auth; customers/admins follow the link.
 *
 * Use for any planning, booking, or trip CTA that's surfaced on
 * visitor-accessible (marketing) pages.
 */
export function GatedAction({ to, children, className, feature = "planning & bookings" }: Props) {
  const { viewAs } = useAuth();
  const navigate = useNavigate();

  if (viewAs !== "visitor") {
    return (
      <Link to={to as "/"} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        toast(`Sign up free to unlock ${feature}`, {
          description: "Takes 10 seconds — we'll save your picks.",
        });
        setTimeout(() => navigate({ to: "/auth" }), 200);
      }}
    >
      {children}
    </button>
  );
}
