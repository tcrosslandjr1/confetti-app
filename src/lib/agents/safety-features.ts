/**
 * Confetti safety features — the 7 guarantees on every social surface.
 * Mirrors docs/agents/confetti-safety-features.md.
 */

export type GroupGenderPolicy = "women-only" | "men-only" | "mixed";

export interface SafetyFeatures {
  /** Profile must be verified (ID + selfie match) to host or join open groups. */
  verifiedProfilesOnly: boolean;
  /** Private invites: link/code only — not surfaced in public discovery. */
  privateInvitesEnabled: boolean;
  /** Gender policy on the group. */
  genderPolicy: GroupGenderPolicy;
  /** Stops must be public meetup venues — no residential addresses. */
  publicMeetupOnly: boolean;
  /** Host must approve each join request before address/details unlock. */
  friendApprovalRequired: boolean;
  /** Report + block tools available on every profile, group, and message. */
  reportBlockEnabled: boolean;
  /** Exact venue address hidden until the user is accepted into the group. */
  hideAddressUntilAccepted: boolean;
}

export const SAFETY_DEFAULTS: SafetyFeatures = {
  verifiedProfilesOnly: true,
  privateInvitesEnabled: true,
  genderPolicy: "mixed",
  publicMeetupOnly: true,
  friendApprovalRequired: true,
  reportBlockEnabled: true,
  hideAddressUntilAccepted: true,
};
