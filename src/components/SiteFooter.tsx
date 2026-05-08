export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h4 className="font-display text-xl font-bold">
              confetti<span className="text-gradient">.</span>
            </h4>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The bright, joyful way to discover events worth showing up for.
            </p>
          </div>
          {[
            { title: "Discover", items: ["Music", "Tech", "Food", "Arts"] },
            { title: "Organize", items: ["Create event", "Pricing", "Tools"] },
            { title: "Company", items: ["About", "Careers", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h5 className="text-sm font-semibold">{col.title}</h5>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {col.items.map((i) => (
                  <li key={i} className="cursor-pointer hover:text-foreground">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Confetti. Throw better events.
        </p>
      </div>
    </footer>
  );
}
