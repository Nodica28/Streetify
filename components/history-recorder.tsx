"use client";

import * as React from "react";
import { pushHistory } from "@/lib/history";

interface Props {
  slug: string;
  address: string;
  walk_score: number;
  drive_score: number;
  urban_label: string;
}

export function HistoryRecorder({ slug, address, walk_score, drive_score, urban_label }: Props) {
  React.useEffect(() => {
    pushHistory({ slug, address, walk_score, drive_score, urban_label, ts: Date.now() });
  }, [slug, address, walk_score, drive_score, urban_label]);
  return null;
}
