import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";

export default function Search() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();

  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");

  const { data: departures, isLoading } = trpc.departures.publicList.useQuery(
    { from, to, date: date || undefined },
    { enabled: !!from && !!to }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (date) p.set("date", date);
    navigate("/search?" + p.toString());
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="bg-mats-purple-light/30 py-8">
        <div className="mx-auto max-w-5xl px-4">
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Départ" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Arrivée" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90">Rechercher</Button>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 flex-1 w-full">
        {!from || !to ? (
          <p className="text-center text-gray-500 py-12">Indiquez une ville de départ et d'arrivée pour voir les trajets disponibles.</p>
        ) : isLoading ? (
          <p className="text-center text-gray-500 py-12">Recherche en cours...</p>
        ) : !departures || departures.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Aucun départ trouvé pour {from} → {to}.</p>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">{departures.length} départ(s) trouvé(s)</h2>
            {departures.map((dep) => (
              <Card key={dep.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {dep.departureCity} <ArrowRight className="h-4 w-4 text-mats-purple" /> {dep.arrivalCity}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {dep.departureDate} à {dep.departureTime}
                    {dep.estimatedArrivalTime && " — arrivée estimée " + dep.estimatedArrivalTime}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dep.availableSeats} place(s) disponible(s)
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-mats-purple">
                    {dep.priceXof ? dep.priceXof + " XOF" : "Prix sur demande"}
                  </div>
                  <Link href={"/reserver/" + dep.departureRef}>
                    <Button className="bg-mats-purple hover:bg-mats-purple/90" disabled={dep.availableSeats <= 0}>
                      {dep.availableSeats <= 0 ? "Complet" : "Réserver"}
                    </Button>
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
