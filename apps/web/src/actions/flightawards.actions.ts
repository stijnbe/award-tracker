import { client } from "@award-tracker/db";

type FlightAwardSearchParams = {
  origin?: string;
  destination?: string;
  sort?: string;
};

export const searchFlightAwards = async (params: FlightAwardSearchParams) => {
  const flights = await client.flightAward.findMany({
    where: {
      origin: params.origin ?? undefined,
      destination: params.destination ?? undefined,
    },
    orderBy: {
      [params.sort ?? "departureDate"]: "asc",
    },
    include: {
      segments: {
        include: {
          aircraft: true,
          airline: true,
        },
      },
      layovers: {
        include: {
          airport: true,
        },
      },
    },
  });

  return flights;
};
