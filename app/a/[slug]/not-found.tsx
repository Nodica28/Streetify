import Link from "next/link";
import { StreetifyMark } from "@/components/streetify-mark";
import { AddressSearch } from "@/components/address-search";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <header className="container flex items-center justify-between py-5">
        <Link href="/" className="text-lg">
          <StreetifyMark />
        </Link>
      </header>
      <main className="container flex min-h-[calc(100vh-80px)] flex-col items-start justify-center gap-8 pb-24">
        <div className="max-w-xl space-y-4">
          <p className="kicker">Error 404 — no address on file</p>
          <h1 className="display-serif text-5xl font-semibold tracking-tight md:text-6xl">
            That address hasn't been mapped yet.
          </h1>
          <p className="text-base text-muted-foreground">
            The link may have expired or never existed. Try searching for it directly — every
            address gets a stable, shareable URL the first time it's analyzed.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <AddressSearch autoFocus />
        </div>
      </main>
    </div>
  );
}
