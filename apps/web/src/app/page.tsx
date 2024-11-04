import FlightAwards from "@/components/fligthawards/FlightAwards";

export default async function Home({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    origin: string;
    destination: string;
    fareClass: string;
    sort: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-semibold">
            ✈️ Flight Awards Discovery Dashboard
          </h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <FlightAwards {...searchParams} />
      </main>
    </div>
  );
}
