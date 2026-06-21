import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import SeatPicker from "@/components/SeatPicker";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  used: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const SEAT_CLASS_LABELS: Record<string, string> = {
  ordinaire: "Ordinaire",
  confort: "Confort",
  vip: "VIP",
};

const CHANNEL_LABELS: Record<string, string> = {
  guichet: "Guichet (gare)",
  en_ligne: "En ligne",
  agent_mobile: "Agent mobile",
  telephone: "Téléphone",
};

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: "Carte d'identité",
  passport: "Passeport",
  consular_card: "Carte consulaire",
  resident_card: "Carte de résident",
  laissez_passer: "Laissez-passer",
  other: "Autre",
};

function CreateTicketDialog() {
  const [open, setOpen] = useState(false);
  const [departureRef, setDepartureRef] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [passengerIdType, setPassengerIdType] = useState("national_id");
  const [passengerIdNumber, setPassengerIdNumber] = useState("");
  const [passengerGender, setPassengerGender] = useState<"male" | "female" | "other" | "">("");
  const [seatNumber, setSeatNumber] = useState("");
  const [seatClass, setSeatClass] = useState<"ordinaire" | "confort" | "vip">("ordinaire");
  const [bookingChannel, setBookingChannel] = useState<"guichet" | "en_ligne" | "agent_mobile" | "telephone">("guichet");
  const [destinationCity, setDestinationCity] = useState("");
  const [dropOffStop, setDropOffStop] = useState("");
  const [luggageCount, setLuggageCount] = useState("0");
  const [pricePaid, setPricePaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "card" | "transfer">("cash");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("paid");

  const utils = trpc.useUtils();
  const { data: departures } = trpc.departures.list.useQuery({ status: "scheduled" });
  const { data: fares } = trpc.config.getRouteFares.useQuery();

  const selectedDeparture = departures?.find((d) => d.departureRef === departureRef);
  const stops = trpc.config.getStops.useQuery(
    { lineCode: selectedDeparture?.lineCode ?? undefined },
    { enabled: !!selectedDeparture?.lineCode }
  );
  const occupiedSeatsQuery = trpc.tickets.getOccupiedSeats.useQuery(
    { departureRef },
    { enabled: !!departureRef }
  );

  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: (ticket) => {
      toast.success(`Billet ${ticket.ticketNumber} créé`);
      utils.tickets.list.invalidate();
      utils.departures.list.invalidate();
      utils.dashboard.stats.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setDepartureRef(""); setPassengerName(""); setPassengerPhone(""); setEmergencyPhone("");
    setPassengerIdType("national_id"); setPassengerIdNumber(""); setPassengerGender("");
    setSeatNumber(""); setSeatClass("ordinaire"); setBookingChannel("guichet");
    setDestinationCity(""); setDropOffStop(""); setLuggageCount("0");
    setPricePaid(""); setPaymentMethod("cash"); setPaymentStatus("paid");
  }

  function handleDepartureChange(ref: string) {
    setDepartureRef(ref);
    const dep = departures?.find((d) => d.departureRef === ref);
    if (dep) {
      setDestinationCity(dep.arrivalCity);
      const fare = fares?.find(
        (f) => f.fromCity === dep.departureCity && f.toCity === dep.arrivalCity
      );
      if (fare) setPricePaid(fare.priceXof);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTicket.mutate({
      departureRef: departureRef || undefined,
      passengerName,
      passengerPhone,
      emergencyPhone: emergencyPhone || undefined,
      passengerIdType: passengerIdType as any,
      passengerIdNumber: passengerIdNumber || undefined,
      passengerGender: passengerGender || undefined,
      seatNumber: seatNumber || undefined,
      seatClass,
      bookingChannel,
      destinationCity: destinationCity || undefined,
      dropOffStop: dropOffStop || undefined,
      luggageCount: Number(luggageCount),
      pricePaid,
      currency: "XOF",
      paymentMethod,
      paymentStatus,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouveau billet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Émettre un billet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Départ *</Label>
            <Select value={departureRef} onValueChange={handleDepartureChange}>
              <SelectTrigger><SelectValue placeholder="Choisir un départ" /></SelectTrigger>
              <SelectContent>
                {departures?.map((d) => (
                  <SelectItem key={d.id} value={d.departureRef}>
                    {d.departureCity} → {d.arrivalCity} — {d.departureDate} {d.departureTime} ({d.availableSeats} pl.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Passager</h3>
            <div className="space-y-3">
              <div>
                <Label>Nom complet *</Label>
                <Input required value={passengerName} onChange={(e) => setPassengerName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Téléphone *</Label>
                  <Input required value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Contact d'urgence</Label>
                  <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </div>
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
                  <Label>N° de pièce</Label>
                  <Input value={passengerIdNumber} onChange={(e) => setPassengerIdNumber(e.target.value)} />
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
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Voyage</h3>
            <div className="space-y-3">
              {!departureRef ? (
                <p className="text-sm text-gray-400 italic">Choisissez d'abord un départ pour voir le plan du bus.</p>
              ) : (
                <div>
                  <Label>Siège</Label>
                  <SeatPicker
                    totalSeats={selectedDeparture?.totalSeats ?? 70}
                    occupiedSeats={occupiedSeatsQuery.data?.occupiedSeats ?? []}
                    crewSeats={occupiedSeatsQuery.data?.crewSeats ?? ["1", "2", "3", "4"]}
                    selectedSeat={seatNumber}
                    onSelect={setSeatNumber}
                    isAdmin
                  />
                </div>
              )}
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
                <Label>Canal de réservation</Label>
                <Select value={bookingChannel} onValueChange={(v) => setBookingChannel(v as typeof bookingChannel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nombre de bagages</Label>
                <Input type="number" min="0" value={luggageCount} onChange={(e) => setLuggageCount(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Paiement</h3>
            <div className="space-y-3">
              <div>
                <Label>Prix payé (XOF) *</Label>
                <Input required type="number" min="0" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Méthode de paiement</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="card">Carte</SelectItem>
                      <SelectItem value="transfer">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Statut paiement</Label>
                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as typeof paymentStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={createTicket.isPending || !departureRef}>
              {createTicket.isPending ? "Émission..." : "Émettre le billet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const CHANNEL_COLORS: Record<string, string> = {
  guichet: "bg-blue-100 text-blue-700",
  en_ligne: "bg-purple-100 text-purple-700",
  agent_mobile: "bg-amber-100 text-amber-700",
  telephone: "bg-gray-100 text-gray-700",
};

export default function Tickets() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const utils = trpc.useUtils();
  const { data: tickets, isLoading } = trpc.tickets.list.useQuery({
    search: search || undefined,
    bookingChannel: channelFilter !== "all" ? channelFilter : undefined,
  });

  const cancelTicket = trpc.tickets.cancel.useMutation({
    onSuccess: () => {
      toast.success("Billet annulé");
      utils.tickets.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout title="Billetterie">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un billet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les canaux</SelectItem>
              {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CreateTicketDialog />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">N° Billet</th>
              <th className="px-4 py-3 font-medium">Passager</th>
              <th className="px-4 py-3 font-medium">Siège</th>
              <th className="px-4 py-3 font-medium">Classe</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Prix</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !tickets || tickets.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun billet trouvé.</td></tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="px-4 py-3">{t.passengerName}</td>
                  <td className="px-4 py-3">{t.seatNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{SEAT_CLASS_LABELS[t.seatClass] ?? t.seatClass}</td>
                  <td className="px-4 py-3">
                    <Badge className={CHANNEL_COLORS[t.bookingChannel]}>{CHANNEL_LABELS[t.bookingChannel] ?? t.bookingChannel}</Badge>
                  </td>
                  <td className="px-4 py-3">{t.pricePaid} {t.currency}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelTicket.mutate({ id: t.id })}
                        disabled={cancelTicket.isPending}
                      >
                        Annuler
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </DashboardLayout>
  );
}
