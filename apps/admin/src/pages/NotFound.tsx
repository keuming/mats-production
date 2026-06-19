import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-mats-purple mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page introuvable.</p>
      <Link href="/">
        <Button className="bg-mats-purple hover:bg-mats-purple/90">Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
