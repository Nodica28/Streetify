import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { StreetifyMark } from "@/components/streetify-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="street-grid absolute inset-0 -z-10 opacity-70" />

      <header className="container flex items-center justify-between py-5">
        <Link href="/" className="text-lg">
          <StreetifyMark />
        </Link>
        <nav className="flex items-center gap-1">
          <ThemeToggle />
        </nav>
      </header>

      <main className="container flex min-h-[calc(100vh-88px)] flex-col justify-center gap-14 pb-24">
        <section className="max-w-3xl space-y-6">
          <p className="kicker">Issue N°01 — the neighborhood, quantified</p>
          <h1 className="display-serif text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
            The story of any
            <br />
            address, told in
            <br />
            <span className="text-accent">three scores.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Type a street address. We tally the amenities in walking and driving reach, then
            translate them into scores you can actually feel — and a map you can share.
          </p>
        </section>

        <section className="space-y-6">
          <HomeHero />
        </section>

        <footer className="grid grid-cols-2 gap-8 border-t border-border pt-8 text-sm text-muted-foreground md:grid-cols-4">
          <FooterCol title="Walking Score" body="Weighted count of amenities within 1 km, with a bonus for category diversity." />
          <FooterCol title="Driving Score" body="Same idea, larger radius — 5 km — because a car flattens distance." />
          <FooterCol title="Urban Index" body="A single label — urban, suburban, rural — derived from amenity density." />
          <FooterCol title="Data" body="OpenStreetMap via Nominatim and Overpass. Everything cached, no key required." />
        </footer>
      </main>
    </div>
  );
}

function FooterCol({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1.5">
      <p className="kicker text-foreground">{title}</p>
      <p className="text-xs leading-relaxed">{body}</p>
    </div>
  );
}
