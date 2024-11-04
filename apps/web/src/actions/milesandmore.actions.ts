"use server";

import { scanFlightAwards } from "@award-tracker/milesandmore";

export async function scanMilesAndMoreFlights() {
  await scanFlightAwards();

  return {
    success: true,
  };
}
