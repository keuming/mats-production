import { useState } from "react";
import { Package, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";

const STATUS_LABELS: Record<string, string> = {
  registered: "Enregistré",
  in_transit: "En transit",
  delivered: "Livré",
  returned: "Retourné",
  lost: "Perdu",
};

export default function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: shipment, isLoading, isError } = trpc.shipments.track.useQuery(
    { trackingNumber: searchTerm },
    { enabled: !!searchTerm }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(trackingNumber);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-xl px-4 py-12 flex-1 w-full">
        <div className="text-center mb-8">
          <Package className="h-12 w-12 text-mats-purple mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Suivre un colis</h1>
          <p className="text-gray-600 mt-1">Entrez votre numéro de suivi</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            placeholder="Ex: EXP-A1B2C3D4"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90">
            <SearchIcon className="h-4 w-4" />
          </Button>
        </form>

        {isLoading && <p className="text-center text-gray-500">Recherche...</p>}
        {isError && <p className="text-center text-red-500">Erreur lors de la recherche.</p>}
        {searchTerm && !isLoading && !shipment && (
          <p className="text-center text-gray-500">Aucun colis trouvé avec ce numéro.</p>
        )}

        {shipment && (
          <Card className="p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Numéro</span>
              <span className="font-mono font-semibold">{shipment.trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut</span>
              <span className="font-semibold text-mats-purple">{STATUS_LABELS[shipment.status] ?? shipment.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trajet</span>
              <span>{shipment.originCity} → {shipment.destinationCity}</span>
            </div>
            {shipment.description && (
              <div className="flex justify-between">
                <span className="text-gray-500">Description</span>
                <span>{shipment.description}</span>
              </div>
            )}
          </Card>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
