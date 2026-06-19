import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name, phone || undefined);
      toast.success("Compte créé avec succès");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm p-6">
          <h1 className="text-xl font-bold mb-6 text-center">Créer un compte</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-mats-purple hover:bg-mats-purple/90" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ? <Link href="/connexion" className="text-mats-purple font-medium">Se connecter</Link>
          </p>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
