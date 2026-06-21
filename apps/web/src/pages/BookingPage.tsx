import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SeatPicker from "@/components/SeatPicker";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SEAT_CLASS_LABELS: Record<string, string> = {
  ordinaire: "Ordinaire",
  confort: "Confort",
  vip: "VIP",
};

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: "Carte d'identité",
  passport: "Passeport",
  consular_card: "Carte consulaire",
  resident_card: "Carte de résident",
  laissez_passer: "Laissez-passer",
  other: "Autre",
};

export default function BookingPage() {
  const { departureRef } = useParams<{ departureRef: string }>();
  const [, navigate] = useLocation();

  const { data: departure, isLoading } = trpc.departures.getByRef.useQuery({ ref: departureRef! });
  const occupiedSeatsQuery = trpc.tickets.getOccupiedSeats.useQuery(
    { departureRef: departureRef! },
    { enabled: !!departureRef }
  );
  const { data: fares } = trpc.config.getRouteFares.useQuery();
  const stops = trpc.config.getStops.useQuery(
    { lineCode: departure?.lineCode ?? undefined },
    { enabled: !!departure?.lineCode }
  );

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
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [passengerIdType, setPassengerIdType] = useState("national_id");
  const [passengerIdNumber, setPassengerIdNumber] = useState("");
  const [passengerGender, setPassengerGender] = useState<"male" | "female" | "other" | "">("");
  const [seatNumber, setSeatNumber] = useState("");
  const [seatClass, setSeatClass] = useState<"ordinaire" | "confort" | "vip">("ordinaire");
  const [dropOffStop, setDropOffStop] = useState("");
  const [luggageCount, setLuggageCount] = useState("0");
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
      emergencyPhone: emergencyPhone || undefined,
      passengerIdType: passengerIdType as any,
      passengerIdNumber: passengerIdNumber || undefined,
      passengerGender: passengerGender || undefined,
      seatNumber,
      seatClass,
      dropOffStop: dropOffStop || undefined,
      luggageCount: Number(luggageCount),
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
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Passager</h3>
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input id="name" required value={passengerName} onChange={(e) => setPassengerName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" required value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Contact d'urgence</Label>
                  <Input id="emergencyPhone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input id="email" type="email" value={passengerEmail} onChange={(e) => setPassengerEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type de pièce</Label>
                  <Select value={passengerIdType} onValueChange={setPassengerIdType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ID_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="idNumber">N° de pièce</Label>
                  <Input id="idNumber" value={passengerIdNumber} onChange={(e) => setPassengerIdNumber(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Genre</Label>
                <Select value={passengerGender} onValueChange={(v) => setPassengerGender(v as typeof passengerGender)}>
                  <SelectTrigger><SelectValue placeholder="Non spécifié" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Voyage</h3>
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
                <Label>Classe</Label>
                <Select value={seatClass} onValueChange={(v) => setSeatClass(v as typeof seatClass)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEAT_CLASS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Arrêt de descente (si différent du terminus)</Label>
                <Select value={dropOffStop} onValueChange={setDropOffStop}>
                  <SelectTrigger><SelectValue placeholder="Terminus" /></SelectTrigger>
                  <SelectContent>
                    {stops.data?.map((s) => (
                      <SelectItem key={s.id} value={s.stationName}>{s.stationName} — {s.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="luggage">Nombre de bagages</Label>
                <Input id="luggage" type="number" min="0" value={luggageCount} onChange={(e) => setLuggageCount(e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Paiement</h3>
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

              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold text-mats-purple">
                  {price ? price + " XOF" : "Prix sur demande"}
                </span>
              </div>
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
