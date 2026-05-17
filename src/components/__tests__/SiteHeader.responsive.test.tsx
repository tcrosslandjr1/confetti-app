/**
 * Responsive regression tests for <SiteHeader />.
 *
 * jsdom does not apply Tailwind's responsive utilities, so we can't measure
 * computed layout. Instead, we lock in the breakpoint contract by asserting
 * that the responsive visibility / spacing classes are present on the right
 * elements. If someone removes/changes a breakpoint class accidentally
 * (e.g. drops `min-[1400px]:block` from CitySelector), these tests fail.
 *
 * Covered alignment guarantees:
 *   - Logo always visible, never hidden by a breakpoint class
 *   - Marketing nav appears at md+ and stays as a flex row
 *   - Tagline ticker strip is hidden until ≥1600px (no overlap on smaller widths)
 *   - CitySelector hidden until ≥1400px
 *   - "Sign up free" CTA hidden until ≥1320px
 *   - Header container is capped at max-w-[1600px] with consistent gaps/padding
 *   - Mobile hamburger hidden at md+, desktop nav hidden below md
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

// Mock @tanstack/react-router Link so we don't need a Router context.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className, ...rest }: any) => (
    <a href={typeof to === "string" ? to : "#"} className={className} {...rest}>
      {children}
    </a>
  ),
}));

// Mock auth so the visitor branch renders the "Sign up free" CTA.
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ viewAs: "visitor", signOut: vi.fn(), user: null }),
}));

vi.mock("@/hooks/useScrolled", () => ({ useScrolled: () => false }));

vi.mock("@/components/CitySelector", () => ({
  CitySelector: ({ className = "" }: { className?: string; compact?: boolean }) => (
    <div data-testid="city-selector" className={className} />
  ),
}));

vi.mock("@/components/NotificationsBell", () => ({
  NotificationsBell: () => <div data-testid="notifications-bell" />,
}));

vi.mock("@/components/wizard/WizardButton", () => ({
  WizardButton: ({ children, className, ariaLabel }: any) => (
    <button aria-label={ariaLabel} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => <>{children}</>,
  SheetTrigger: ({ children }: any) => <>{children}</>,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
}));

import { SiteHeader } from "@/components/SiteHeader";

function renderHeader() {
  const utils = render(<SiteHeader />);
  const header = utils.container.querySelector("header");
  if (!header) throw new Error("header not rendered");
  const container = header.firstElementChild as HTMLElement;
  return { ...utils, header, container };
}

describe("<SiteHeader /> responsive layout contract", () => {
  it("header container is capped at 1600px with responsive gaps and padding", () => {
    const { container } = renderHeader();
    const cls = container.className;
    expect(cls).toContain("max-w-[1600px]");
    expect(cls).toContain("w-full");
    expect(cls).toContain("mx-auto");
    expect(cls).toMatch(/\bflex\b/);
    expect(cls).toContain("items-center");
    // responsive height + horizontal padding
    expect(cls).toContain("h-14");
    expect(cls).toContain("sm:h-16");
    expect(cls).toContain("px-3");
    expect(cls).toContain("sm:px-6");
    expect(cls).toContain("lg:px-8");
    // responsive gaps so logo / nav / actions don't collide
    expect(cls).toContain("gap-3");
    expect(cls).toContain("sm:gap-4");
    expect(cls).toContain("lg:gap-4");
  });

  it("logo link is always visible (no hidden/breakpoint-gated class)", () => {
    renderHeader();
    const logos = screen.getAllByLabelText(/confetti — home/i);
    // First logo is the desktop one inside <header>
    const headerLogo = logos[0];
    expect(headerLogo.className).not.toMatch(/\bhidden\b/);
    expect(headerLogo.className).toContain("shrink-0");
  });

  it("rotating tagline ticker strip is hidden until ≥1600px", () => {
    const { header } = renderHeader();
    // Tagline is the first sibling after the logo, before the nav.
    const tagline = header.querySelector(".animate-tagline-in")?.closest("span");
    expect(tagline).toBeTruthy();
    const cls = (tagline as HTMLElement).parentElement?.parentElement?.className ?? "";
    expect(cls).toContain("hidden");
    expect(cls).toContain("min-[1600px]:inline-flex");
    expect(cls).toContain("shrink-0");
  });

  it("desktop marketing nav is hidden below md and shows as a flex row at md+", () => {
    const { header } = renderHeader();
    const nav = header.querySelector("nav");
    expect(nav).toBeTruthy();
    const cls = (nav as HTMLElement).className;
    expect(cls).toContain("hidden");
    expect(cls).toContain("md:flex");
    expect(cls).toContain("items-center");
    // each nav link should be present and not individually hidden
    const links = within(nav as HTMLElement).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const l of links) expect(l.className).not.toMatch(/\bhidden\b/);
  });

  it("CitySelector is hidden until ≥1400px", () => {
    renderHeader();
    const city = screen.getByTestId("city-selector");
    expect(city.className).toContain("hidden");
    expect(city.className).toContain("min-[1400px]:block");
  });

  it("Sign up free CTA is hidden until ≥1320px", () => {
    renderHeader();
    const cta = screen.getByText(/sign up free/i);
    expect(cta.className).toContain("hidden");
    expect(cta.className).toContain("min-[1320px]:inline-flex");
    expect(cta.className).toContain("whitespace-nowrap");
  });

  it("desktop 'Build a night' button is hidden below sm; mobile FAB is hidden at sm+", () => {
    renderHeader();
    const buildButtons = screen.getAllByLabelText(/build a night/i);
    expect(buildButtons.length).toBe(2);
    const desktop = buildButtons.find((b) => b.className.includes("sm:inline-flex"))!;
    const mobile = buildButtons.find((b) => b.className.includes("sm:hidden"))!;
    expect(desktop.className).toContain("hidden");
    expect(mobile.className).toContain("inline-flex");
  });

  it("hamburger menu trigger is visible below md and hidden at md+", () => {
    renderHeader();
    const menuBtn = screen.getByLabelText(/open menu/i);
    expect(menuBtn.className).toContain("md:hidden");
    expect(menuBtn.className).toContain("inline-flex");
  });

  it("actions cluster is right-aligned with consistent gap (no overlap with nav)", () => {
    const { header } = renderHeader();
    // Find the ml-auto actions div
    const actions = header.querySelector(".ml-auto");
    expect(actions).toBeTruthy();
    const cls = (actions as HTMLElement).className;
    expect(cls).toContain("ml-auto");
    expect(cls).toContain("flex");
    expect(cls).toContain("items-center");
    expect(cls).toContain("gap-2");
  });
});
