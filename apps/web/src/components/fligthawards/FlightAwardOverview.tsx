"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Plane, Search } from "lucide-react";
import { parseAsString, parseAsStringEnum } from "nuqs";
import { useQueryStates } from "nuqs";
import { formatDistanceToNow, isAfter, subDays } from "date-fns";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";
import { FlightAward } from "@award-tracker/db";
import { searchFlightAwards } from "@/actions/flightawards.actions";

export default function FlightAwardOverview({
  flights,
}: {
  flights: Awaited<ReturnType<typeof searchFlightAwards>>;
}) {
  const [params, setParams] = useQueryStates(
    {
      origin: parseAsString.withDefault(""),
      destination: parseAsString.withDefault(""),
      fareClass: parseAsString.withDefault("all"),
      sort: parseAsStringEnum([
        "origin",
        "destination",
        "departureDate",
      ]).withDefault("departureDate"),
    },
    {
      shallow: false,
      clearOnDefault: true,
    }
  );

  function isNew(flightAward: FlightAward) {
    return isAfter(flightAward.createdAt, subDays(new Date(), 1));
  }

  const newFlights = flights.filter(isNew);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              🏆 Total Awards Found
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flights.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">🆕 New Awards</CardTitle>
            <Badge>New</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newFlights.length}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>🔍 Available Flight Awards</CardTitle>
          <CardDescription>
            Discover and filter the latest award flights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="flex-1">
              <label htmlFor="origin-filter" className="sr-only">
                Filter by origin
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin-filter"
                  placeholder="🛫 Filter by origin"
                  value={params.origin ?? ""}
                  onChange={(e) => setParams({ origin: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="destination-filter" className="sr-only">
                Filter by destination
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination-filter"
                  placeholder="🛬 Filter by destination"
                  value={params.destination ?? ""}
                  onChange={(e) => setParams({ destination: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={params.fareClass ?? "all"}
              onValueChange={(value) => setParams({ fareClass: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="🛋️ Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="first">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => setParams({ sort: "origin" })}
                    >
                      Origin
                      {params.sort === "origin" && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => setParams({ sort: "destination" })}
                    >
                      Destination
                      {params.sort === "destination" && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Miles</TableHead>
                  <TableHead className="text-right">Taxes</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => setParams({ sort: "departureDate" })}
                    >
                      Date
                      {params.sort === "departureDate" && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Layovers</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flights.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell className="font-medium">
                      {award.origin}
                    </TableCell>
                    <TableCell>{award.destination}</TableCell>
                    <TableCell>First Class</TableCell>
                    <TableCell className="text-right">
                      {award.miles?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(award.taxes! / 100).toFixed(2)} {award.currency}
                    </TableCell>
                    <TableCell>
                      {award.departureDate}
                      {isNew(award) && (
                        <Badge variant="secondary" className="ml-2">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {award.segments.map((s) => s.aircraft.name).join(", ")}
                    </TableCell>
                    <TableCell>
                      {award.layovers
                        .map((s) => `${s.airport.name} (${s.layoverDuration}m)`)
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(award.createdAt, {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
