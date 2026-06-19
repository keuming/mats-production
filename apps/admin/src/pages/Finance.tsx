import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function Finance() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: summary } = trpc.finance.summary.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: transactions, isLoading } = trpc.finance.transactions.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 50,
  });

  return (
    <DashboardLayout title="Caisse & Finance">
      <div className="flex gap-3 mb-4 flex-wrap">
        <div>
          <Label className="text-xs">Du</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Au</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Revenus</span>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{summary?.income ?? "0"} XOF</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Dépenses</span>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{summary?.expense ?? "0"} XOF</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Solde net</span>
            <Wallet className="h-5 w-5 text-mats-purple" />
          </div>
          <div className="text-2xl font-bold text-mats-purple">{summary?.net ?? "0"} XOF</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !transactions || transactions.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucune transaction.</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3 text-gray-500">{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <span className={tx.type === "income" ? "text-green-600" : "text-red-600"}>
                      {tx.type === "income" ? "Recette" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tx.category}</td>
                  <td className="px-4 py-3">{tx.description}</td>
                  <td className={`px-4 py-3 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "income" ? "+" : "-"}{tx.amount} {tx.currency}
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
