import { scanFlightAwards } from "@award-tracker/milesandmore";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET() {
  try {
    await scanFlightAwards();

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
