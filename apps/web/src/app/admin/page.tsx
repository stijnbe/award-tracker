import React from "react";
import { Button } from "@/components/ui/button";
import { scanMilesAndMoreFlights } from "@/actions/milesandmore.actions";

export default function AdminPage() {
  return (
    <div>
      <h1>Admin</h1>
      <Button onClick={scanMilesAndMoreFlights}>Refresh Flight Awards</Button>
    </div>
  );
}
