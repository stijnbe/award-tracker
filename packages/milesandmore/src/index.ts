import {
  checkIfLoginIsNeeded,
  FlightInfo,
  getBestByDay,
  login,
} from "./milesAndMore.api";

import { PrismaClient } from "@award-tracker/db";

const client = new PrismaClient();

async function findFirstClassDates(
  origin: string,
  destinations: string[]
): Promise<FlightInfo[]> {
  const flights: FlightInfo[] = [];

  for (const destination of destinations) {
    const result = await getBestByDay({
      commercialFareFamilies: ["CFFFIRSINS"],
      corporateCodes: [223293],
      countryOfCommencement: "BE",
      currencyCode: "EUR",
      itineraries: [
        {
          departureDateTime: "2024-12-01T00:00:00",
          destinationLocationCode: destination,
          originLocationCode: origin,
        },
      ],
      tripDetails: { rangeOfDeparture: 180 },
    });

    //update airports
    for (const [code, airport] of Object.entries(
      result.dictionaries.location
    ).filter((l) => l[1].type === "airport")) {
      await client.airport.upsert({
        where: { code },
        update: {
          name: airport.airportName,
          cityName: airport.cityName,
          countryCode: airport.countryCode,
        },
        create: {
          code,
          name: airport.airportName,
          cityName:
            airport.cityName ??
            result.dictionaries.location[airport.cityCode]?.cityName ??
            "",
          countryCode: airport.countryCode,
        },
      });
    }

    //update aircrafts
    for (const [code, aircraft] of Object.entries(
      result.dictionaries.aircraft
    )) {
      await client.aircraft.upsert({
        where: { code },
        update: { name: aircraft },
        create: { code, name: aircraft },
      });
    }

    //update airlines
    for (const [code, airline] of Object.entries(result.dictionaries.airline)) {
      await client.airline.upsert({
        where: { code },
        update: { name: airline },
        create: { code, name: airline },
      });
    }

    //upsert flight awards
    for (const flight of result.flights) {
      await client.flightAward.upsert({
        where: { externalFlightId: flight.id },
        update: {
          lastSeenAt: new Date(),
        },
        create: {
          externalFlightId: flight.id,
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight.departureDate,
          miles: flight.miles,
          taxes: flight.taxes,
          currency: flight.currency,
          segments: {
            createMany: {
              data: flight.segments.map((segment, index) => ({
                ...segment,
                segmentOrder: index,
              })),
            },
          },
          layovers: {
            createMany: {
              data: flight.layovers.map((layover, index) => ({
                ...layover,
                layoverOrder: index,
              })),
            },
          },
        },
      });
    }

    flights.push(...result.flights);

    // Add 1 second delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return flights;
}

const DESTINATIONS = {
  HND: "Tokyo",
  SIN: "Singapore",
  BKK: "Bangkok",
  MNL: "Manila",
  TPE: "Taipei",
  LAX: "Los Angeles",
  SFO: "San Francisco",
  HNL: "Honolulu",
  JFK: "New York",
  HAN: "Hanoi",
  ICN: "Seoul",
  KUL: "Kuala Lumpur",
  CGQ: "Changchun",
  SJO: "San Jose - Costa Rica",
};

async function scanFlightAwards() {
  //check if we need to login
  const needsLogin = await checkIfLoginIsNeeded();

  if (needsLogin) {
    await login(
      process.env.MILES_AND_MORE_USERNAME!,
      process.env.MILES_AND_MORE_PASSWORD!
    );
  }

  const flights = await findFirstClassDates("BRU", Object.keys(DESTINATIONS));

  console.log(`Found ${flights.length} flights`);
}

export { scanFlightAwards };
