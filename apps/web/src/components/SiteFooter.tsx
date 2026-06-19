import { Link } from "wouter";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-gray-50 mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-bold text-lg text-mats-purple mb-2">MATS</div>
          <p className="text-sm text-gray-600">
            Maashaa Allah Transport Service — Voyagez en toute confiance à travers l'Afrique de l'Ouest.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">Navigation</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/search">Rechercher un trajet</Link></li>
            <li><Link href="/departs">Départs</Link></li>
            <li><Link href="/tarifs">Tarifs</Link></li>
            <li><Link href="/suivi">Suivre un colis</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">Mon compte</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/connexion">Connexion</Link></li>
            <li><Link href="/inscription">Créer un compte</Link></li>
            <li><Link href="/mes-reservations">Mes réservations</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>support@matstransport.com</li>
            <li>+229 91 72 44 88</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} MATS — Maashaa Allah Transport Service. Tous droits réservés.
      </div>
    </footer>
  );
}
