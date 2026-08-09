"use client";

import * as React from "react";
import { AddressSearch } from "./address-search";
import { RecentSearches } from "./recent-searches";

export function HomeHero() {
  const [seed, setSeed] = React.useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <AddressSearch autoFocus key={seed ?? "empty"} initialValue={seed ?? ""} />
      <RecentSearches onExampleClick={(addr) => setSeed(addr)} />
    </div>
  );
}
