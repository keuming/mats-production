import { useState } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, MapPin, Calendar, ShieldCheck, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const POPULAR_ROUTES = [
  { from: "Abidjan", to: "Accra" },
  { from: "Cotonou", to: "Lomé" },
  { from: "Porto-Novo", to: "Cotonou" },
  { from: "Ouagadougou", to: "Bamako" },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Sécurité", desc: "Bus contrôlés et chauffeurs expérimentés" },
  { icon: Clock, title: "Ponctualité", desc: "Départs respectés à l'heure annoncée" },
  { icon: Package, title: "Expéditions", desc: "Envoyez vos colis en toute confiance" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="relative bg-gradient-to-br from-mats-purple to-mats-purple-dark text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <h1 className="text-3xl md:text-5xl font-bold max-w-2xl">
            Voyagez à travers l'Afrique de l'Ouest en toute confiance
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-xl">
            Réservez vos billets de bus en ligne — trajets nationaux et internationaux : Ghana, Côte d'Ivoire, Togo, Bénin, Mali, Burkina Faso.
          </p>

          <form onSubmit={handleSearch} className="mt-8 bg-white rounded-xl p-4 shadow-xl grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] max-w-3xl">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ville de départ"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-9 text-gray-900"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ville d'arrivée"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-9 text-gray-900"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 text-gray-900"
              />
            </div>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90">
              <SearchIcon className="h-4 w-4 mr-2" /> Rechercher
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-xl font-semibold mb-4">Trajets populaires</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {POPULAR_ROUTES.map((route) => (
            <button
              key={`${route.from}-${route.to}`}
              onClick={() => navigate(`/search?from=${route.from}&to=${route.to}`)}
              className="rounded-lg border p-4 text-left hover:border-mats-purple hover:shadow-md transition-all"
            >
              <div className="text-sm text-gray-500">{route.from}</div>
              <div className="font-semibold">→ {route.to}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-mats-purple-light flex items-center justify-center">
                <f.icon className="h-6 w-6 text-mats-purple" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
