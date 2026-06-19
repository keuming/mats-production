import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

export default function Manifeste() {
  const { ref } = useParams<{ ref: string }>();
  const { data, isLoading } = trpc.manifeste.get.useQuery({ departureRef: ref! });

  return (
    <DashboardLayout title={`Manifeste — ${ref}`}>
      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : !data ? (
        <p className="text-gray-500">Départ introuvable.</p>
      ) : (
        <>
          <Card className="p-5 mb-6">
            <div className="grid gap-4 md:grid-cols-4 text-sm">
              <div>
                <div className="text-gray-500">Trajet</div>
                <div className="font-semibold">{data.departure.departureCity} → {data.departure.arrivalCity}</div>
              </div>
              <div>
                <div className="text-gray-500">Date / Heure</div>
                <div className="font-semibold">{data.departure.departureDate} {data.departure.departureTime}</div>
              </div>
              <div>
                <div className="text-gray-500">Bus</div>
                <div className="font-semibold">{data.departure.busNumber ?? "—"}</div>
              </div>
              <div>
                <div className="text-gray-500">Places</div>
                <div className="font-semibold">{data.departure.availableSeats}/{data.departure.totalSeats}</div>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => window.print()}>Imprimer le manifeste</Button>
            </div>
          </Card>

          <h2 className="font-semibold mb-2">Passagers ({data.tickets.length})</h2>
          <Card className="overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Siège</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Téléphone</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.tickets.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucun passager.</td></tr>
                ) : (
                  data.tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3">{t.seatNumber ?? "—"}</td>
                      <td className="px-4 py-3">{t.passengerName}</td>
                      <td className="px-4 py-3 text-gray-500">{t.passengerPhone}</td>
                      <td className="px-4 py-3"><Badge>{t.status}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          <h2 className="font-semibold mb-2">Expéditions ({data.shipments.length})</h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">N° Suivi</th>
                  <th className="px-4 py-3 font-medium">Expéditeur</th>
                  <th className="px-4 py-3 font-medium">Destinataire</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.shipments.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucune expédition.</td></tr>
                ) : (
                  data.shipments.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-mono text-xs">{s.trackingNumber}</td>
                      <td className="px-4 py-3">{s.senderName}</td>
                      <td className="px-4 py-3">{s.recipientName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
