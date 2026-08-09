import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getInsightsBySlug } from "@/lib/insights-service";
import { InsightsMap } from "@/components/insights-map";
import { ScoreCard, UrbanCard } from "@/components/score-card";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { ShareButton } from "@/components/share-button";
import { HistoryRecorder } from "@/components/history-recorder";
import { StreetifyMark } from "@/components/streetify-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { walkQualitativeLabel, driveQualitativeLabel } from "@/lib/scoring";
import { CATEGORY_KEYS } from "@/lib/types";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const insights = await getInsightsBySlug(slug);
  if (!insights) return { title: "Streetify — address not found" };
  return {
    title: `${insights.address} — Streetify`,
    description: `Walking ${insights.walk_score}, Driving ${insights.drive_score}, ${insights.urban_label} density. See the map on Streetify.`,
    openGraph: {
      title: `Streetify — ${insights.address}`,
      description: `Walking ${insights.walk_score} · Driving ${insights.drive_score} · ${insights.urban_label}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Streetify — ${insights.address}`,
      description: `Walking ${insights.walk_score} · Driving ${insights.drive_score} · ${insights.urban_label}`,
    },
  };
}

export default async function InsightsPage({ params }: Params) {
  const { slug } = await params;
  const insights = await getInsightsBySlug(slug);
  if (!insights) notFound();

  const shortAddress = insights.address.split(",").slice(0, 2).join(",");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Search
            </Link>
            <span className="h-4 w-px bg-border" />
            <Link href="/" className="text-base">
              <StreetifyMark />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div>
              <p className="kicker mb-2">Address</p>
              <h1 className="display-serif text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {shortAddress}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{insights.address}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <ScoreCard
                kicker="Walking Score"
                score={insights.walk_score}
                label={walkQualitativeLabel(insights.walk_score)}
                helper="Weighted amenities within a 1 km walk, with distance decay and a diversity bonus."
              />
              <ScoreCard
                kicker="Driving Score"
                score={insights.drive_score}
                label={driveQualitativeLabel(insights.drive_score)}
                helper="Same weighting inside a 5 km radius, where a car flattens distance."
              />
              <UrbanCard
                label={insights.urban_label}
                density={insights.density}
                count={CATEGORY_KEYS.reduce((sum, k) => sum + (insights.categories[k] ?? 0), 0)}
              />
            </div>

            <div className="rounded-sm border border-border bg-card p-5">
              <CategoryBreakdown counts={insights.categories} />
            </div>

            <ShareButton address={shortAddress} slug={insights.slug} />

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Data © OpenStreetMap contributors, retrieved via Nominatim + Overpass. Refreshed
              {" "}
              {new Date(insights.refreshed_at).toLocaleDateString()}. Shared pages are public.
            </p>
          </section>

          <section>
            <InsightsMap
              lat={insights.lat}
              lng={insights.lng}
              address={insights.address}
              amenities={insights.amenities}
            />
          </section>
        </div>
      </main>

      <HistoryRecorder
        slug={insights.slug}
        address={shortAddress}
        walk_score={insights.walk_score}
        drive_score={insights.drive_score}
        urban_label={insights.urban_label}
      />
    </div>
  );
}
