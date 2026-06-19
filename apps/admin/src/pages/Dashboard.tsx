import { Ticket, Package, Wallet, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const CARDS = [
    { label: "Billets actifs", value: stats?.activeTickets ?? 0, icon: Ticket, color: "text-mats-purple" },
    { label: "Expéditions en attente", value: stats?.pendingShipments ?? 0, icon: Package, color: "text-orange-500" },
    { label: "Recette du jour", value: `${stats?.todayRevenue ?? 0} XOF`, icon: Wallet, color: "text-green-600" },
  ];

  return (
    <DashboardLayout title="Tableau de Bord">
      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.label}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : card.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-mats-purple" />
          <h2 className="font-semibold">Bienvenue sur le tableau de bord MATS</h2>
        </div>
        <p className="text-sm text-gray-600">
          Utilisez le menu latéral pour gérer les billets, départs, expéditions, finances et la configuration de la compagnie.
        </p>
      </Card>
    </DashboardLayout>
  );
}
