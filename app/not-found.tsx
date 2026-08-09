import Link from "next/link";
import { StreetifyMark } from "@/components/streetify-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <header className="container flex items-center justify-between py-5">
        <Link href="/" className="text-lg">
          <StreetifyMark />
        </Link>
      </header>
      <main className="container flex min-h-[calc(100vh-80px)] flex-col items-start justify-center gap-6">
        <p className="kicker">Error 404</p>
        <h1 className="display-serif text-6xl font-semibold tracking-tight md:text-7xl">Nothing on this block.</h1>
        <p className="max-w-xl text-muted-foreground">
          The page you're looking for doesn't exist. Head back to the search and start with an
          address.
        </p>
        <Button asChild variant="signal" size="lg">
          <Link href="/">Back to search</Link>
        </Button>
      </main>
    </div>
  );
}
