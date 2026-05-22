/**
 * Verifies redirect handling on the three auth-entry routes for the three
 * user types the product cares about:
 *   - customer: signed-in user with no business affiliation
 *   - business owner: has business_owner role OR owns an advertiser row
 *   - non-owner: signed-in user with no role and no advertiser
 *
 * Covers:
 *   1. /auth search-param sanitization (redirect + mode)
 *   2. /auth?mode=signin search-param sanitization
 *   3. /admin/login search-param sanitization
 *   4. Post-auth destination decision for each user type
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase + ads BEFORE importing the helper under test.
const maybeSingleMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: maybeSingleMock }),
        }),
      }),
    }),
  },
}));

const getMyAdvertiserMock = vi.fn();
vi.mock("@/lib/ads", () => ({
  getMyAdvertiser: (uid: string) => getMyAdvertiserMock(uid),
}));

import { Route as AuthRoute } from "@/routes/auth";
import { Route as AdminLoginRoute } from "@/routes/admin.login";
import {
  decidePostAuthDestination,
  isGenericRedirect,
} from "@/lib/auth-redirect";

const validateAuth = (s: Record<string, unknown>) =>
  (AuthRoute.options as { validateSearch: (s: Record<string, unknown>) => unknown }).validateSearch(s);
const validateAdmin = (s: Record<string, unknown>) =>
  (AdminLoginRoute.options as { validateSearch: (s: Record<string, unknown>) => unknown }).validateSearch(s);

describe("/auth — validateSearch", () => {
  it("accepts a safe in-app redirect and defaults mode to undefined", () => {
    expect(validateAuth({ redirect: "/trips/abc" })).toEqual({
      redirect: "/trips/abc",
      mode: undefined,
    });
  });

  it("rejects protocol-relative URLs (//evil.com) and falls back to '/'", () => {
    expect(validateAuth({ redirect: "//evil.com" })).toEqual({
      redirect: "/",
      mode: undefined,
    });
  });

  it("rejects absolute external URLs and falls back to '/'", () => {
    expect(validateAuth({ redirect: "https://evil.com" })).toEqual({
      redirect: "/",
      mode: undefined,
    });
  });

  it("ignores non-string redirect values", () => {
    expect(validateAuth({ redirect: 42 })).toEqual({
      redirect: "/",
      mode: undefined,
    });
  });

  it("accepts mode=signin", () => {
    expect(validateAuth({ mode: "signin" })).toEqual({
      redirect: "/",
      mode: "signin",
    });
  });

  it("accepts mode=signup", () => {
    expect(validateAuth({ mode: "signup" })).toEqual({
      redirect: "/",
      mode: "signup",
    });
  });

  it("drops unknown mode values", () => {
    expect(validateAuth({ mode: "hacker" })).toEqual({
      redirect: "/",
      mode: undefined,
    });
  });

  it("combines a safe redirect with mode=signin", () => {
    expect(validateAuth({ redirect: "/business/dashboard", mode: "signin" })).toEqual({
      redirect: "/business/dashboard",
      mode: "signin",
    });
  });
});

describe("/admin/login — validateSearch", () => {
  it("accepts an /admin redirect", () => {
    expect(validateAdmin({ redirect: "/admin/business-claims" })).toEqual({
      redirect: "/admin/business-claims",
    });
  });

  it("drops non-/admin redirects so customers cannot be smuggled in", () => {
    expect(validateAdmin({ redirect: "/trips/abc" })).toEqual({ redirect: undefined });
  });

  it("drops protocol-relative URLs", () => {
    expect(validateAdmin({ redirect: "//evil.com/admin" })).toEqual({ redirect: undefined });
  });

  it("drops the login page itself to prevent loops", () => {
    expect(validateAdmin({ redirect: "/admin/login" })).toEqual({ redirect: undefined });
  });

  it("ignores non-string redirect values", () => {
    expect(validateAdmin({ redirect: null })).toEqual({ redirect: undefined });
  });
});

describe("isGenericRedirect", () => {
  it.each([
    [undefined, true],
    ["", true],
    ["/", true],
    ["/auth", true],
    ["/trips/abc", false],
    ["/business/dashboard", false],
    ["/admin/health", false],
  ])("isGenericRedirect(%p) === %p", (input, expected) => {
    expect(isGenericRedirect(input as string | undefined)).toBe(expected);
  });
});

describe("decidePostAuthDestination — per user type", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    getMyAdvertiserMock.mockReset();
  });

  describe("customer (no role, no advertiser)", () => {
    beforeEach(() => {
      maybeSingleMock.mockResolvedValue({ data: null });
      getMyAdvertiserMock.mockResolvedValue(null);
    });

    it("lands on '/' for a generic redirect", async () => {
      expect(await decidePostAuthDestination("u-customer", "/")).toEqual({ to: "/" });
    });

    it("honors an explicit deep link", async () => {
      expect(await decidePostAuthDestination("u-customer", "/trips/abc")).toEqual({
        to: "/trips/abc",
      });
    });

    it("falls back to '/' when redirect is undefined", async () => {
      expect(await decidePostAuthDestination("u-customer", undefined)).toEqual({ to: "/" });
    });
  });

  describe("business owner (has role)", () => {
    beforeEach(() => {
      maybeSingleMock.mockResolvedValue({ data: { role: "business_owner" } });
      getMyAdvertiserMock.mockResolvedValue(null);
    });

    it("bounces to /business/dashboard on a generic redirect", async () => {
      expect(await decidePostAuthDestination("u-owner", "/")).toEqual({
        to: "/business/dashboard",
      });
    });

    it("still honors an explicit non-generic redirect", async () => {
      expect(await decidePostAuthDestination("u-owner", "/trips/xyz")).toEqual({
        to: "/trips/xyz",
      });
    });

    it("treats /auth as generic and bounces to /business/dashboard", async () => {
      expect(await decidePostAuthDestination("u-owner", "/auth")).toEqual({
        to: "/business/dashboard",
      });
    });
  });

  describe("business owner (advertiser row only, no role)", () => {
    beforeEach(() => {
      maybeSingleMock.mockResolvedValue({ data: null });
      getMyAdvertiserMock.mockResolvedValue({ id: "adv-1", user_id: "u-adv" });
    });

    it("bounces to /business/dashboard via advertiser fallback", async () => {
      expect(await decidePostAuthDestination("u-adv", undefined)).toEqual({
        to: "/business/dashboard",
      });
    });
  });

  describe("non-owner (role lookup fails, no advertiser)", () => {
    beforeEach(() => {
      maybeSingleMock.mockRejectedValue(new Error("rls denied"));
      getMyAdvertiserMock.mockResolvedValue(null);
    });

    it("lands on '/' for a generic redirect (no crash)", async () => {
      expect(await decidePostAuthDestination("u-other", "/")).toEqual({ to: "/" });
    });

    it("honors an explicit redirect even when role lookup throws", async () => {
      expect(await decidePostAuthDestination("u-other", "/about")).toEqual({ to: "/about" });
    });
  });
});
