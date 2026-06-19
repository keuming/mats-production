import { Link, useLocation } from "wouter";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Ticket, Bus, Package, Wallet, Receipt,
  Settings, Users, UserCog, Menu, X, LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de Bord", icon: LayoutDashboard },
  { href: "/tickets", label: "Billetterie", icon: Ticket },
  { href: "/departures", label: "Départs", icon: Bus },
  { href: "/shipments", label: "Expéditions", icon: Package },
  { href: "/finance", label: "Caisse & Finance", icon: Wallet },
  { href: "/charges", label: "Charges", icon: Receipt },
  { href: "/staff", label: "Personnel", icon: UserCog },
  { href: "/users", label: "Gestion Utilisateurs", icon: Users },
  { href: "/configuration", label: "Configuration", icon: Settings },
];

export default function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-mats-purple-light">MATS</div>
            <div className="text-xs text-gray-400">Espace Compagnie</div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-mats-purple text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-mats-purple flex items-center justify-center font-bold text-sm">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.role === "admin" ? "Administrateur" : "Staff"}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 h-14">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-gray-900">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
