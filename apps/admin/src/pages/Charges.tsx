import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Charges() {
  const utils = trpc.useUtils();
  const { data: charges, isLoading } = trpc.charges.list.useQuery({});
  const disburse = trpc.charges.disburse.useMutation({
    onSuccess: () => {
      toast.success("Charge décaissée");
      utils.charges.list.invalidate();
    },
  });

  return (
    <DashboardLayout title="Gestion des Charges">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !charges || charges.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucune charge.</td></tr>
            ) : (
              charges.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3 text-gray-500">{c.description}</td>
                  <td className="px-4 py-3">{c.amount} {c.currency}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></td>
                  <td className="px-4 py-3">
                    {c.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => disburse.mutate({ id: c.id })}>
                        Décaisser
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
