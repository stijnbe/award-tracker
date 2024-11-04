import FlightAwardOverview from "./FlightAwardOverview";
import { searchFlightAwards } from "@/actions/flightawards.actions";
export default async function FlightAwards({
  origin,
  destination,
  fareClass,
  sort,
}: {
  origin?: string;
  destination?: string;
  fareClass?: string;
  sort?: string;
}) {
  const flights = await searchFlightAwards({ origin, destination, sort });

  return <FlightAwardOverview flights={flights} />;
}
