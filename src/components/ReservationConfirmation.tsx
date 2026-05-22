/**
 * ReservationConfirmation — booking confirmation card with
 * modify & cancel actions, and countdown to reservation.
 */

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Edit3,
  X,
  AlertTriangle,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

export type BookingDetails = {
  id: string;
  venueName: string;
  venueAddress?: string;
  date: string;       // "2026-06-15"
  time: string;       // "19:30"
  partySize: number;
  confirmationCode: string;
  status: "confirmed" | "modified" | "cancelled";
  specialRequests?: string;
  reminderSent?: boolean;
};

export function ReservationConfirmation({
  booking,
  onModify,
  onCancel,
}: {
  booking: BookingDetails;
  onModify?: (id: string) => void;
  onCancel?: (id: string, reason: string) => void;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const dateObj = new Date(`${booking.date}T${booking.time}`);
  const isUpcoming = dateObj.getTime() > Date.now();
  const isCancelled = booking.status === "cancelled";

  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Countdown
  const diff = dateObj.getTime() - Date.now();
  const daysUntil = Math.floor(diff / 86400000);
  const hoursUntil = Math.floor((diff % 86400000) / 3600000);

  function copyCode() {
    navigator.clipboard.writeText(booking.confirmationCode);
    toast.success("Confirmation code copied!");
  }

  function handleCancel() {
    onCancel?.(booking.id, cancelReason);
    setShowCancel(false);
    toast("Reservation cancelled");
  }

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border-2 p-5 shadow-brut ${
        isCancelled
          ? "border-red-300 bg-red-50/50"
          : "border-ink bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                isCancelled
                  ? "bg-red-100 text-red-600"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {booking.status}
            </span>
            {isUpcoming && !isCancelled && daysUntil <= 3 && (
              <span className="font-mono text-[10px] text-coral font-bold">
                {daysUntil === 0
                  ? `In ${hoursUntil}h`
                  : `In ${daysUntil}d`}
              </span>
            )}
          </div>
          <h3 className="mt-1 font-display text-lg font-bold text-ink">
            {booking.venueName}
          </h3>
        </div>

        {/* Confirmation code */}
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1 rounded-lg border border-ink/10 bg-cream/50 px-2 py-1"
        >
          <span className="font-mono text-[11px] font-bold tracking-wider text-ink/70">
            {booking.confirmationCode.toUpperCase()}
          </span>
          <Copy className="h-3 w-3 text-ink/40" />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-ink/40" />
          <span className="text-sm text-ink/80">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-ink/40" />
          <span className="text-sm text-ink/80">{formattedTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-ink/40" />
          <span className="text-sm text-ink/80">
            {booking.partySize} guest{booking.partySize !== 1 ? "s" : ""}
          </span>
        </div>
        {booking.venueAddress && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-ink/40" />
            <span className="text-sm text-ink/80">{booking.venueAddress}</span>
          </div>
        )}
      </div>

      {booking.specialRequests && (
        <p className="rounded-lg bg-cream/50 px-3 py-2 text-[12px] text-ink/60 italic">
          "{booking.specialRequests}"
        </p>
      )}

      {/* Cancel confirmation */}
      {showCancel && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Cancel reservation?
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white"
            >
              <X className="h-3 w-3" /> Confirm cancel
            </button>
            <button
              type="button"
              onClick={() => setShowCancel(false)}
              className="rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50 hover:bg-ink/5"
            >
              Keep reservation
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {isUpcoming && !isCancelled && !showCancel && (
        <div className="flex gap-2 pt-1">
          {onModify && (
            <button
              type="button"
              onClick={() => onModify(booking.id)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition hover:-translate-y-0.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> Modify
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-300 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
