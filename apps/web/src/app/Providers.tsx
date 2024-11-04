import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
