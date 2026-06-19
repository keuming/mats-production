import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowRight } from "lucide-react";

export default function Tarifs() {
  const { data: fares, isLoading } = trpc.config.getRouteFares.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-12 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-6">Nos tarifs</h1>

        {isLoading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : !fares || fares.length === 0 ? (
          <p className="text-gray-500">Aucun tarif disponible pour le moment.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {fares.map((fare) => (
              <Card key={fare.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  {fare.fromCity} <ArrowRight className="h-4 w-4 text-mats-purple" /> {fare.toCity}
                </div>
                <div className="font-bold text-mats-purple">{fare.priceXof} XOF</div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
