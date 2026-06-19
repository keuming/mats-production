import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  registered: "bg-blue-100 text-blue-700",
  in_transit: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  returned: "bg-orange-100 text-orange-700",
  lost: "bg-red-100 text-red-700",
};

export default function Shipments() {
  const utils = trpc.useUtils();
  const { data: shipments, isLoading } = trpc.shipments.list.useQuery({});
  const updateStatus = trpc.shipments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour");
      utils.shipments.list.invalidate();
    },
  });

  return (
    <DashboardLayout title="Gestion des Expéditions">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">N° Suivi</th>
              <th className="px-4 py-3 font-medium">Expéditeur</th>
              <th className="px-4 py-3 font-medium">Destinataire</th>
              <th className="px-4 py-3 font-medium">Trajet</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !shipments || shipments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune expédition.</td></tr>
            ) : (
              shipments.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono text-xs">{s.trackingNumber}</td>
                  <td className="px-4 py-3">{s.senderName}</td>
                  <td className="px-4 py-3">{s.recipientName}</td>
                  <td className="px-4 py-3">{s.originCity} → {s.destinationCity}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                  <td className="px-4 py-3">
                    {s.status !== "delivered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: s.id, status: "delivered" })}
                      >
                        Marquer livré
                      </Button>
                    )}
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
