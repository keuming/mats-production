import { Link } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";

export default function DeparturesPublic() {
  const { data: departures, isLoading } = trpc.departures.publicList.useQuery({});

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-6">Départs planifiés</h1>

        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Chargement...</p>
        ) : !departures || departures.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Aucun départ planifié pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {departures.map((dep) => (
              <Card key={dep.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {dep.departureCity} <ArrowRight className="h-4 w-4 text-mats-purple" /> {dep.arrivalCity}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {dep.departureDate} à {dep.departureTime}
                  </div>
                  {dep.departureStation && (
                    <div className="text-sm text-gray-500">Gare: {dep.departureStation}</div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">{dep.availableSeats} places restantes</div>
                  <Link href={`/search?from=${dep.departureCity}&to=${dep.arrivalCity}&date=${dep.departureDate}`}>
                    <Button className="bg-mats-purple hover:bg-mats-purple/90">Voir</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
