import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

export default function Configuration() {
  const { data: buses, isLoading: loadingBuses } = trpc.config.getBuses.useQuery();
  const { data: stations, isLoading: loadingStations } = trpc.config.getStations.useQuery();
  const { data: fares, isLoading: loadingFares } = trpc.config.getRouteFares.useQuery();
  const { data: lines, isLoading: loadingLines } = trpc.config.getBusLines.useQuery();

  return (
    <DashboardLayout title="Configuration">
      <Tabs defaultValue="buses">
        <TabsList>
          <TabsTrigger value="buses">Bus</TabsTrigger>
          <TabsTrigger value="stations">Gares</TabsTrigger>
          <TabsTrigger value="fares">Tarifs</TabsTrigger>
          <TabsTrigger value="lines">Lignes</TabsTrigger>
        </TabsList>

        <TabsContent value="buses">
          <Card className="overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">N° Bus</th>
                  <th className="px-4 py-3 font-medium">Plaque</th>
                  <th className="px-4 py-3 font-medium">Places</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingBuses ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !buses?.length ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucun bus enregistré.</td></tr>
                ) : (
                  buses.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3">{b.busNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{b.licensePlate ?? "—"}</td>
                      <td className="px-4 py-3">{b.totalSeats}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="stations">
          <Card className="overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Pays</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingStations ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !stations?.length ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucune gare enregistrée.</td></tr>
                ) : (
                  stations.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.city}</td>
                      <td className="px-4 py-3 text-gray-500">{s.country}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="fares">
          <Card className="overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Trajet</th>
                  <th className="px-4 py-3 font-medium">Prix XOF</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingFares ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !fares?.length ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Aucun tarif configuré.</td></tr>
                ) : (
                  fares.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-3">{f.fromCity} → {f.toCity}</td>
                      <td className="px-4 py-3 font-medium">{f.priceXof}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="lines">
          <Card className="overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingLines ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !lines?.length ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucune ligne configurée.</td></tr>
                ) : (
                  lines.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                      <td className="px-4 py-3">{l.name}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{l.type}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
