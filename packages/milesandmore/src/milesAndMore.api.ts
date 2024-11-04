//Call the Miles and More API to discover new first class dates and destinations
/*
https://api.miles-and-more.com/flights/v3/bestbyday

*/

import puppeteer from "puppeteer";
import kv from "@award-tracker/kv";

type BestByDayRequest = {
  commercialFareFamilies: string[];
  corporateCodes: number[];
  countryOfCommencement: string;
  currencyCode: string;
  itineraries: {
    departureDateTime: string;
    destinationLocationCode: string;
    originLocationCode: string;
  }[];
  tripDetails: {
    rangeOfDeparture: number;
  };
};

type BestByDayResponse = {
  data: {
    departureDate: string;
    prices: {
      totalPrices: {
        currencyCode: string;
        totalTaxes: number;
      }[];
      milesConversion: {
        convertedMiles: {
          base: number;
        };
      };
    };

    fareInfos: any[];
    fareFamilyCode: string;
    bounds: {
      fareFamilyCode: string;
      flights: any[];
    }[];
  }[];
  dictionaries: {
    location: Record<
      string,
      {
        type: string;
        airportName: string;
        cityCode: string;
        cityName?: string;
        countryCode: string;
      }
    >;
    country: Record<string, string>;
    airline: Record<string, string>;
    aircraft: Record<string, string>;
    flight: Record<string, any>;
    currency: Record<string, string>;
    anonymousTraveler: Record<string, any>;
    fareFamilyWithServices: Record<string, any>;
  };
};

async function checkIfLoginIsNeeded(): Promise<boolean> {
  //check if the cookies are expired
  const cookies = await getCookies();
  if (!cookies) {
    return true;
  }

  //check if cookie with name "bm_sv" is expired
  const bmSvCookie = cookies.find((cookie) => cookie.name === "bm_sv");
  if (!bmSvCookie) {
    return true;
  }

  //check if the cookie is expired
  if (bmSvCookie.expires * 1000 < Date.now()) {
    return true;
  }

  return false;
}

async function getCookies(): Promise<
  { name: string; value: string; expires: number }[] | null
> {
  //read the cookies from the KV store
  const cookiesJSON = await kv.get("milesandmore_cookies");
  if (!cookiesJSON) {
    return null;
  }

  return JSON.parse(cookiesJSON);
}

async function getBestByDay(payload: BestByDayRequest): Promise<{
  flights: FlightInfo[];
  dictionaries: BestByDayResponse["dictionaries"];
}> {
  const cookies = await getCookies();

  const response = await fetch(
    "https://api.miles-and-more.com/flights/v3/bestbyday",
    {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,nl;q=0.8,fr;q=0.7",
        "content-type": "application/json",
        priority: "u=1, i",
        rtw: "true",
        "sec-ch-ua":
          '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",

        Referer: "https://www.miles-and-more.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        cookie: cookies
          ? cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
          : "",
      },
      body: JSON.stringify(payload),
    }
  );

  //expect 400 error if no flights are found
  if (response.status === 400) {
    return {
      flights: [],
      dictionaries: {
        location: {},
        country: {},
        airline: {},
        aircraft: {},
        flight: {},
        currency: {},
        anonymousTraveler: {},
        fareFamilyWithServices: {},
      },
    };
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, error: ${error}`);
  }

  const data = (await response.json()) as BestByDayResponse;

  return {
    flights: cleanBestByDayResponse(data),
    dictionaries: data.dictionaries,
  };
}

type FlightSegment = {
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  aircraftCode: string;
  airlineCode: string;
};

type Layover = {
  airportCode: string;
  layoverDuration: number;
};

export type FlightInfo = {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  segments: FlightSegment[];
  layovers: Layover[];
  taxes: number;
  currency: string;
  miles: number;
};

const calculateLayoverDuration = (
  arrivalTime: string,
  departureTime: string
): number => {
  const arrival = new Date(arrivalTime);
  const departure = new Date(departureTime);
  const durationMs = departure.getTime() - arrival.getTime();
  return Math.round(durationMs / 60000); // Convert to minutes
};

const generateFlightId = (
  departureDate: string,
  segments: Array<{
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
  }>,
  miles: number,
  taxes: number,
  currency: string
): string => {
  // Create a unique string combining date and flight numbers/routes
  const flightPath = segments
    .map(
      (seg) =>
        `${seg.flightNumber}-${seg.departureAirport}${seg.arrivalAirport}`
    )
    .join("-");
  return `${departureDate}-${flightPath}-${miles}-${taxes}-${currency}`;
};

function cleanBestByDayResponse(response: BestByDayResponse): FlightInfo[] {
  return response.data.map((item, index) => {
    // Find flight segments for this departure date
    const flightKeys = Object.keys(response.dictionaries.flight).filter((key) =>
      key.includes(item.departureDate)
    );

    // Sort flight segments by departure time
    const sortedFlightSegments = flightKeys
      .map((key) => response.dictionaries.flight[key])
      .sort(
        (a, b) =>
          new Date(a.departure.dateTime).getTime() -
          new Date(b.departure.dateTime).getTime()
      );

    // Create flight segments
    const flightSegments: FlightSegment[] = sortedFlightSegments.map(
      (segment) => ({
        flightNumber: `${segment.marketingAirlineCode}${segment.marketingFlightNumber}`,
        departureAirport: segment.departure.locationCode,
        arrivalAirport: segment.arrival.locationCode,
        departureTime: segment.departure.dateTime,
        arrivalTime: segment.arrival.dateTime,
        aircraftCode: segment.aircraftCode,
        airlineCode: segment.marketingAirlineCode,
      })
    );

    // Calculate layovers
    const layovers: Layover[] = [];
    for (let i = 0; i < flightSegments.length - 1; i++) {
      const currentFlight = flightSegments[i]!;
      const nextFlight = flightSegments[i + 1]!;

      layovers.push({
        airportCode: currentFlight.arrivalAirport,
        layoverDuration: calculateLayoverDuration(
          currentFlight.arrivalTime,
          nextFlight.departureTime
        ),
      });
    }

    const miles = item.prices.milesConversion.convertedMiles.base;
    const taxes = item.prices.totalPrices[0]?.totalTaxes ?? 0;
    const currency = item.prices.totalPrices[0]?.currencyCode ?? "EUR";

    const id = generateFlightId(
      item.departureDate,
      flightSegments,
      miles,
      taxes,
      currency
    );

    return {
      id: id,
      origin: flightSegments[0]!.departureAirport,
      destination: flightSegments[flightSegments.length - 1]!.arrivalAirport,
      departureDate: item.departureDate,
      segments: flightSegments,
      layovers,
      taxes,
      currency,
      miles,
    };
  });
}

async function login(username: string, password: string) {
  console.log("Logging in...");

  //use puppeteer to login
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    );
    await page.goto("https://account.miles-and-more.com/web/be/en/login.html");

    //fill username
    await page.waitForSelector("#id-loginStepOne-textfield");
    await page.type("#id-loginStepOne-textfield", username);

    //click next
    //click button with class travelid-login__continueButton
    await page.click(".travelid-login__continueButton");

    //fill password
    await page.waitForSelector("#id-loginStepTwoPassword-textfield");
    await page.type("#id-loginStepTwoPassword-textfield", password);

    //Click login button
    await page.click(".travelid-login__loginButton");

    //wait for the page to load and extract the cookies
    await page.waitForNavigation();
    const cookies = await page.cookies();
    //store the cookies in the KV store
    await kv.set("milesandmore_cookies", JSON.stringify(cookies));

    console.log("Cookies stored");
    await browser.close();
  } catch (error) {
    console.error("Failed to login:", error);
  }
}

export { getBestByDay, login, checkIfLoginIsNeeded };
