import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  boarding: "bg-amber-100 text-amber-700",
  departed: "bg-purple-100 text-purple-700",
  arrived: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Departures() {
  const { data: departures, isLoading } = trpc.departures.list.useQuery({});

  return (
    <DashboardLayout title="Gestion des Départs">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Réf.</th>
              <th className="px-4 py-3 font-medium">Trajet</th>
              <th className="px-4 py-3 font-medium">Date / Heure</th>
              <th className="px-4 py-3 font-medium">Places</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !departures || departures.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun départ planifié.</td></tr>
            ) : (
              departures.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-mono text-xs">{d.departureRef}</td>
                  <td className="px-4 py-3">{d.departureCity} → {d.arrivalCity}</td>
                  <td className="px-4 py-3">{d.departureDate} {d.departureTime}</td>
                  <td className="px-4 py-3">{d.availableSeats}/{d.totalSeats}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></td>
                  <td className="px-4 py-3">
                    <Link href={`/manifeste/${d.departureRef}`}>
                      <Button size="sm" variant="outline">Manifeste</Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </DashboardLayout>
  );
}
