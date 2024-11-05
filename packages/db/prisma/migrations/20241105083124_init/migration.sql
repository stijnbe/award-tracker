-- CreateTable
CREATE TABLE "FlightAward" (
    "id" TEXT NOT NULL,
    "externalFlightId" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "taxes" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "miles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightSegment" (
    "id" SERIAL NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "aircraftCode" TEXT NOT NULL,
    "airlineCode" TEXT NOT NULL,
    "flightAwardId" TEXT NOT NULL,
    "segmentOrder" INTEGER NOT NULL,

    CONSTRAINT "FlightSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layover" (
    "id" SERIAL NOT NULL,
    "layoverDuration" INTEGER NOT NULL,
    "airportCode" TEXT NOT NULL,
    "flightAwardId" TEXT NOT NULL,
    "layoverOrder" INTEGER NOT NULL,

    CONSTRAINT "Layover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Aircraft" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Airline" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Airline_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightAward_externalFlightId_key" ON "FlightAward"("externalFlightId");

-- CreateIndex
CREATE INDEX "FlightAward_departureDate_idx" ON "FlightAward"("departureDate");

-- CreateIndex
CREATE INDEX "FlightSegment_flightAwardId_idx" ON "FlightSegment"("flightAwardId");

-- CreateIndex
CREATE INDEX "FlightSegment_departureAirport_arrivalAirport_idx" ON "FlightSegment"("departureAirport", "arrivalAirport");

-- CreateIndex
CREATE INDEX "FlightSegment_departureTime_idx" ON "FlightSegment"("departureTime");

-- CreateIndex
CREATE INDEX "Layover_flightAwardId_idx" ON "Layover"("flightAwardId");

-- CreateIndex
CREATE INDEX "Layover_airportCode_idx" ON "Layover"("airportCode");

-- CreateIndex
CREATE INDEX "Airport_countryCode_idx" ON "Airport"("countryCode");

-- AddForeignKey
ALTER TABLE "FlightSegment" ADD CONSTRAINT "FlightSegment_aircraftCode_fkey" FOREIGN KEY ("aircraftCode") REFERENCES "Aircraft"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightSegment" ADD CONSTRAINT "FlightSegment_airlineCode_fkey" FOREIGN KEY ("airlineCode") REFERENCES "Airline"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightSegment" ADD CONSTRAINT "FlightSegment_flightAwardId_fkey" FOREIGN KEY ("flightAwardId") REFERENCES "FlightAward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layover" ADD CONSTRAINT "Layover_airportCode_fkey" FOREIGN KEY ("airportCode") REFERENCES "Airport"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layover" ADD CONSTRAINT "Layover_flightAwardId_fkey" FOREIGN KEY ("flightAwardId") REFERENCES "FlightAward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
