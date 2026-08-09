"use client";

import * as React from "react";
import type { Map as LeafletMap, LayerGroup, Circle as LCircle } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_KEYS, CATEGORY_META, type Amenity, type CategoryKey } from "@/lib/types";
import { WALK_RADIUS_M, DRIVE_RADIUS_M } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  lat: number;
  lng: number;
  address: string;
  amenities: Amenity[];
}

export function InsightsMap({ lat, lng, address, amenities }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const layersRef = React.useRef<Record<CategoryKey, LayerGroup | null>>({
    groceries: null, food: null, school: null, park: null, health: null, transit: null, shop: null, fun: null,
  });
  const ringsRef = React.useRef<{ walk: LCircle | null; drive: LCircle | null }>({
    walk: null,
    drive: null,
  });

  const [enabled, setEnabled] = React.useState<Record<CategoryKey, boolean>>(
    Object.fromEntries(CATEGORY_KEYS.map((k) => [k, true])) as Record<CategoryKey, boolean>,
  );
  const [showWalkRing, setShowWalkRing] = React.useState(true);
  const [showDriveRing, setShowDriveRing] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: true,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Address pin — accent-colored ring with center dot, no default marker
      L.circleMarker([lat, lng], {
        radius: 10,
        color: "hsl(15, 100%, 55%)",
        fillColor: "hsl(15, 100%, 55%)",
        fillOpacity: 1,
        weight: 3,
      })
        .bindPopup(`<strong>${escapeHtml(address)}</strong>`)
        .addTo(map);

      L.circleMarker([lat, lng], {
        radius: 20,
        color: "hsl(15, 100%, 55%)",
        weight: 2,
        opacity: 0.35,
        fill: false,
      }).addTo(map);

      // Radius rings
      ringsRef.current.walk = L.circle([lat, lng], {
        radius: WALK_RADIUS_M,
        color: "hsl(15, 100%, 55%)",
        weight: 1.2,
        opacity: 0.7,
        fill: false,
        dashArray: "4 6",
      }).addTo(map);

      ringsRef.current.drive = L.circle([lat, lng], {
        radius: DRIVE_RADIUS_M,
        color: "hsl(15, 100%, 55%)",
        weight: 1,
        opacity: 0.35,
        fill: false,
        dashArray: "2 6",
      });

      // Category layers
      for (const key of CATEGORY_KEYS) {
        layersRef.current[key] = L.layerGroup().addTo(map);
      }
      for (const a of amenities) {
        const meta = CATEGORY_META[a.category];
        const marker = L.circleMarker([a.lat, a.lng], {
          radius: 5,
          color: cssVar(meta.colorVar),
          fillColor: cssVar(meta.colorVar),
          fillOpacity: 0.85,
          weight: 1.5,
        }).bindPopup(
          `<div style="font-family: var(--font-body);">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:hsl(var(--muted-foreground))">${meta.label}</div>
            <div style="font-weight:600;margin-top:2px">${escapeHtml(a.name)}</div>
            <div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:2px">${a.distance_m} m away</div>
          </div>`,
        );
        marker.addTo(layersRef.current[a.category]!);
      }

      map.fitBounds([
        [lat - 0.012, lng - 0.02],
        [lat + 0.012, lng + 0.02],
      ]);

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, address, amenities]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    for (const key of CATEGORY_KEYS) {
      const layer = layersRef.current[key];
      if (!layer) continue;
      if (enabled[key]) {
        if (!mapRef.current.hasLayer(layer)) layer.addTo(mapRef.current);
      } else if (mapRef.current.hasLayer(layer)) {
        mapRef.current.removeLayer(layer);
      }
    }
  }, [enabled]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    const walk = ringsRef.current.walk;
    const drive = ringsRef.current.drive;
    if (walk) {
      if (showWalkRing && !mapRef.current.hasLayer(walk)) walk.addTo(mapRef.current);
      else if (!showWalkRing && mapRef.current.hasLayer(walk)) mapRef.current.removeLayer(walk);
    }
    if (drive) {
      if (showDriveRing && !mapRef.current.hasLayer(drive)) drive.addTo(mapRef.current);
      else if (!showDriveRing && mapRef.current.hasLayer(drive)) mapRef.current.removeLayer(drive);
    }
  }, [showWalkRing, showDriveRing]);

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className="kicker mr-2">Rings</span>
        <ToggleChip active={showWalkRing} onClick={() => setShowWalkRing((v) => !v)} accent>
          1 km walk
        </ToggleChip>
        <ToggleChip active={showDriveRing} onClick={() => setShowDriveRing((v) => !v)} accent>
          5 km drive
        </ToggleChip>
        <span className="mx-2 h-4 w-px bg-border" />
        <span className="kicker mr-2">Categories</span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_KEYS.map((key) => {
            const meta = CATEGORY_META[key];
            return (
              <ToggleChip
                key={key}
                active={enabled[key]}
                onClick={() => setEnabled((s) => ({ ...s, [key]: !s[key] }))}
                dotColor={`hsl(var(${meta.colorVar}))`}
              >
                {meta.label}
              </ToggleChip>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() =>
            setEnabled(Object.fromEntries(CATEGORY_KEYS.map((k) => [k, true])) as Record<CategoryKey, boolean>)
          }
        >
          All
        </Button>
      </div>
      <div ref={containerRef} className="aspect-[4/3] w-full lg:aspect-auto lg:h-[640px]" />
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
  accent,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] uppercase tracking-widest transition-colors",
        active
          ? accent
            ? "border-accent bg-accent/10 text-accent"
            : "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground",
      )}
    >
      {dotColor && (
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: active ? dotColor : "hsl(var(--muted-foreground))" }}
        />
      )}
      {children}
    </button>
  );
}

function cssVar(name: string): string {
  if (typeof window === "undefined") return "#666";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : "#666";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
