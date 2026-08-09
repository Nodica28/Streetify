import { ImageResponse } from "next/og";
import { getInsightsBySlug } from "@/lib/insights-service";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Streetify insights";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insights = await getInsightsBySlug(slug);

  const address = insights?.address ?? "Address";
  const walk = insights?.walk_score ?? 0;
  const drive = insights?.drive_score ?? 0;
  const urban = insights?.urban_label ?? "unknown";

  const short = address.split(",").slice(0, 2).join(",").trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0B0B0F",
          color: "#FAFAF7",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 32, fontWeight: 600 }}>
          <span>Street</span>
          <span style={{ color: "#FF5A1F" }}>ify.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 20, textTransform: "uppercase", letterSpacing: 4, color: "#8b8b93" }}>
            Address · N°{(insights?.slug ?? "").toUpperCase()}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            {short}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
          <ScoreBlock label="Walking" value={walk} />
          <ScoreBlock label="Driving" value={drive} />
          <ScoreBlock label="Density" value={urban.toUpperCase()} isText />
        </div>

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 12,
            height: "100%",
            background: "#FF5A1F",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

function ScoreBlock({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <div style={{ fontSize: 18, textTransform: "uppercase", letterSpacing: 3, color: "#8b8b93" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: isText ? 64 : 128,
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}
