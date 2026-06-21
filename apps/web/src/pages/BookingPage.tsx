import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SeatPicker from "@/components/SeatPicker";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BookingPage() {
  const { departureRef } = useParams<{ departureRef: string }>();
  const [, navigate] = useLocation();

  const { data: departure, isLoading } = trpc.departures.getByRef.useQuery({ ref: departureRef! });
  const occupiedSeatsQuery = trpc.tickets.getOccupiedSeats.useQuery(
    { departureRef: departureRef! },
    { enabled: !!departureRef }
  );
  const { data: fares } = trpc.config.getRouteFares.useQuery();

  const price = departure
    ? fares?.find((f) => f.fromCity === departure.departureCity && f.toCity === departure.arrivalCity)?.priceXof
    : undefined;

  const createTicket = trpc.tickets.createPublic.useMutation({
    onSuccess: (ticket) => {
      toast.success("Réservation créée. Confirmez votre paiement.");
      navigate("/confirmation/" + ticket.ticketNumber);
    },
    onError: (err) => toast.error(err.message),
  });

  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "cash" | "card">("mobile_money");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departure) return;
    if (!seatNumber) {
      toast.error("Veuillez choisir un siège");
      return;
    }
    createTicket.mutate({
      departureRef: departure.departureRef,
      passengerName,
      passengerPhone,
      passengerEmail: passengerEmail || undefined,
      seatNumber,
      paymentMethod,
    });
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!departure) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-gray-500">Départ introuvable.</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-2">Réservation</h1>
        <p className="text-gray-600 mb-6">
          {departure.departureCity} → {departure.arrivalCity} — {departure.departureDate} à {departure.departureTime}
        </p>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" required value={passengerName} onChange={(e) => setPassengerName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" required value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email (optionnel)</Label>
              <Input id="email" type="email" value={passengerEmail} onChange={(e) => setPassengerEmail(e.target.value)} />
            </div>

            <div>
              <Label>Choisissez votre siège</Label>
              <SeatPicker
                totalSeats={departure.totalSeats}
                occupiedSeats={occupiedSeatsQuery.data?.occupiedSeats ?? []}
                crewSeats={occupiedSeatsQuery.data?.crewSeats ?? ["1", "2", "3", "4"]}
                selectedSeat={seatNumber}
                onSelect={setSeatNumber}
                isAdmin={false}
              />
            </div>

            <div>
              <Label>Méthode de paiement</Label>
              <div className="flex gap-2 mt-1">
                {(["mobile_money", "cash", "card"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={"px-3 py-2 rounded-md border text-sm " + (paymentMethod === m ? "border-mats-purple bg-mats-purple-light/30" : "border-gray-200")}
                  >
                    {m === "mobile_money" ? "Mobile Money" : m === "cash" ? "Espèces" : "Carte"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold text-mats-purple">
                {price ? price + " XOF" : "Prix sur demande"}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-mats-purple hover:bg-mats-purple/90"
              disabled={createTicket.isPending || !seatNumber}
            >
              {createTicket.isPending ? "Traitement..." : "Confirmer la réservation"}
            </Button>
          </form>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
