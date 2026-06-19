import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [, navigate] = useLocation();
  const id = Number(tripId);

  const { data: trip, isLoading } = trpc.trips.get.useQuery({ id });
  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (booking) => {
      toast.success("Réservation créée. Confirmez votre paiement.");
      navigate(`/confirmation/${booking.bookingRef}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "cash" | "card">("mobile_money");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    createBooking.mutate({
      tripId: id,
      passengerName,
      passengerPhone,
      passengerEmail: passengerEmail || undefined,
      seatNumbers: [],
      totalAmount: trip.priceXof ?? trip.priceGhs,
      currency: "XOF",
      paymentMethod,
    });
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-gray-500">Trajet introuvable.</main>
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
          {trip.departureCity} → {trip.arrivalCity} — {trip.departureDate} à {trip.departureTime}
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
              <Label>Méthode de paiement</Label>
              <div className="flex gap-2 mt-1">
                {(["mobile_money", "cash", "card"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`px-3 py-2 rounded-md border text-sm ${
                      paymentMethod === m ? "border-mats-purple bg-mats-purple-light/30" : "border-gray-200"
                    }`}
                  >
                    {m === "mobile_money" ? "Mobile Money" : m === "cash" ? "Espèces" : "Carte"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold text-mats-purple">{trip.priceXof ?? trip.priceGhs} XOF</span>
            </div>

            <Button type="submit" className="w-full bg-mats-purple hover:bg-mats-purple/90" disabled={createBooking.isPending}>
              {createBooking.isPending ? "Traitement..." : "Confirmer la réservation"}
            </Button>
          </form>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
