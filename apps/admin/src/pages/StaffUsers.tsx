import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StaffUsers() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.staffManagement.list.useQuery();

  const approve = trpc.staffManagement.approve.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur approuvé");
      utils.staffManagement.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const revoke = trpc.staffManagement.revoke.useMutation({
    onSuccess: () => {
      toast.success("Accès révoqué");
      utils.staffManagement.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = users?.filter((u) => !u.dashboardApproved) ?? [];
  const approved = users?.filter((u) => u.dashboardApproved) ?? [];

  return (
    <DashboardLayout title="Gestion des Utilisateurs">
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{users?.length ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Administrateurs</div>
          <div className="text-2xl font-bold">{users?.filter((u) => u.role === "admin").length ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Approuvés</div>
          <div className="text-2xl font-bold">{approved.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">En attente</div>
          <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-800 mb-2">
            {pending.length} utilisateur(s) en attente d'approbation
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Ces utilisateurs se sont inscrits mais n'ont pas encore reçu l'accès au tableau de bord.
          </p>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <Button
                  size="sm"
                  className="bg-mats-purple hover:bg-mats-purple/90"
                  onClick={() => approve.mutate({ userId: u.id, role: "user" })}
                  disabled={approve.isPending}
                >
                  Approuver
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Dernière connexion</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !users || users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucun utilisateur.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role === "admin" ? "Administrateur" : "Utilisateur"}</td>
                  <td className="px-4 py-3">
                    <Badge className={u.dashboardApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                      {u.dashboardApproved ? "Approuvé" : "En attente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.dashboardApproved ? (
                      <Button size="sm" variant="outline" onClick={() => revoke.mutate({ userId: u.id })}>
                        Révoquer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-mats-purple hover:bg-mats-purple/90"
                        onClick={() => approve.mutate({ userId: u.id, role: "user" })}
                      >
                        Approuver
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
