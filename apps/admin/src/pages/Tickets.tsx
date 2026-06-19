import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  used: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export default function Tickets() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const { data: tickets, isLoading } = trpc.tickets.list.useQuery({ search: search || undefined });

  const cancelTicket = trpc.tickets.cancel.useMutation({
    onSuccess: () => {
      toast.success("Billet annulé");
      utils.tickets.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout title="Billetterie">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un billet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouveau billet
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">N° Billet</th>
              <th className="px-4 py-3 font-medium">Passager</th>
              <th className="px-4 py-3 font-medium">Siège</th>
              <th className="px-4 py-3 font-medium">Prix</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !tickets || tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun billet trouvé.</td></tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="px-4 py-3">{t.passengerName}</td>
                  <td className="px-4 py-3">{t.seatNumber ?? "—"}</td>
                  <td className="px-4 py-3">{t.pricePaid} {t.currency}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelTicket.mutate({ id: t.id })}
                        disabled={cancelTicket.isPending}
                      >
                        Annuler
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
