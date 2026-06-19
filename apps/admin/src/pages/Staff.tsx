import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

export default function Staff() {
  const { data: staff, isLoading } = trpc.config.getStaff.useQuery();

  return (
    <DashboardLayout title="Gestion du Personnel">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !staff || staff.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucun membre du personnel.</td></tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono text-xs">{s.employeeId}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone}</td>
                  <td className="px-4 py-3 capitalize">{s.role}</td>
                  <td className="px-4 py-3">
                    <Badge className={s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {s.isActive ? "Actif" : "Inactif"}
                    </Badge>
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
