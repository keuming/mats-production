import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/contexts/AuthContext";

export default function MyBookings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-gray-600 mb-4">Connectez-vous pour voir vos réservations.</p>
          <Link href="/connexion" className="text-mats-purple font-medium">Se connecter</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-6">Mes réservations</h1>
        <p className="text-gray-500">
          Retrouvez ici l'historique de vos réservations. Utilisez votre numéro de référence reçu après réservation pour consulter le statut depuis la page de confirmation.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
