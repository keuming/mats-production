import { useParams } from "wouter";
import { CheckCircle2, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Confirmation() {
  const { ref } = useParams<{ ref: string }>();
  const { data: ticket, isLoading } = trpc.tickets.getByNumber.useQuery({ number: ref! });

  function copyRef() {
    navigator.clipboard.writeText(ref!);
    toast.success("Référence copiée");
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-gray-500">Billet introuvable.</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-xl px-4 py-12 flex-1 w-full">
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Réservation confirmée !</h1>
          <p className="text-gray-600 mt-1">Présentez ce QR code à l'embarquement</p>
        </div>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={ticket.ticketNumber} size={180} />
          </div>
          <button onClick={copyRef} className="inline-flex items-center gap-2 text-mats-purple font-mono font-semibold">
            {ticket.ticketNumber} <Copy className="h-4 w-4" />
          </button>

          <div className="mt-6 space-y-2 text-left text-sm border-t pt-4">
            <div className="flex justify-between"><span className="text-gray-500">Passager</span><span>{ticket.passengerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Téléphone</span><span>{ticket.passengerPhone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Siège</span><span>{ticket.seatNumber ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Montant</span><span>{ticket.pricePaid} {ticket.currency}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Statut paiement</span><span className="capitalize">{ticket.paymentStatus}</span></div>
          </div>
        </Card>

        <Button className="w-full mt-4 bg-mats-purple hover:bg-mats-purple/90" onClick={() => window.print()}>
          Imprimer le billet
        </Button>
      </main>

      <SiteFooter />
    </div>
  );
}
