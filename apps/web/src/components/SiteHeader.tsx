import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { href: "/search", label: "Rechercher un trajet" },
  { href: "/departs", label: "Départs" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/suivi", label: "Suivre un colis" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-mats-purple">
          MATS
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-mats-purple ${
                location === link.href ? "text-mats-purple" : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/mes-reservations">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" /> {user.name}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>Déconnexion</Button>
            </>
          ) : (
            <>
              <Link href="/connexion">
                <Button variant="ghost" size="sm">Connexion</Button>
              </Link>
              <Link href="/inscription">
                <Button size="sm" className="bg-mats-purple hover:bg-mats-purple/90">Inscription</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-700"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex gap-2">
            {user ? (
              <Button variant="outline" size="sm" className="w-full" onClick={logout}>Déconnexion</Button>
            ) : (
              <>
                <Link href="/connexion" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Connexion</Button>
                </Link>
                <Link href="/inscription" className="flex-1">
                  <Button size="sm" className="w-full bg-mats-purple hover:bg-mats-purple/90">Inscription</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
