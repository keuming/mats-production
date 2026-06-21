import { useState } from "react";
import { Link } from "wouter";
import { Plus } from "lucide-react";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  boarding: "bg-amber-100 text-amber-700",
  departed: "bg-purple-100 text-purple-700",
  arrived: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Planifié",
  boarding: "Embarquement",
  departed: "Parti",
  arrived: "Arrivé",
  cancelled: "Annulé",
};

function CreateDepartureDialog() {
  const [open, setOpen] = useState(false);
  const [lineCode, setLineCode] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [departureCountry, setDepartureCountry] = useState("Bénin");
  const [arrivalCountry, setArrivalCountry] = useState("Bénin");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [convoyeurName, setConvoyeurName] = useState("");
  const [departureStation, setDepartureStation] = useState("");
  const [arrivalStation, setArrivalStation] = useState("");
  const [totalSeats, setTotalSeats] = useState("70");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: lines } = trpc.config.getBusLines.useQuery();
  const { data: buses } = trpc.config.getBuses.useQuery();
  const { data: stations } = trpc.config.getStations.useQuery();
  const { data: staff } = trpc.config.getStaff.useQuery();

  const drivers = staff?.filter((s) => s.role === "driver" && s.isActive) ?? [];
  const convoyeurs = staff?.filter((s) => s.role === "convoyeur" && s.isActive) ?? [];

  const createDeparture = trpc.departures.create.useMutation({
    onSuccess: () => {
      toast.success("Départ créé");
      utils.departures.list.invalidate();
      setOpen(false);
      setLineCode(""); setDepartureCity(""); setArrivalCity("");
      setDepartureDate(""); setDepartureTime(""); setEstimatedArrivalTime("");
      setBusNumber(""); setDriverName(""); setConvoyeurName("");
      setDepartureStation(""); setArrivalStation(""); setTotalSeats("70"); setNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createDeparture.mutate({
      lineCode,
      departureCity,
      arrivalCity,
      departureCountry,
      arrivalCountry,
      departureDate,
      departureTime,
      estimatedArrivalTime: estimatedArrivalTime || undefined,
      busNumber: busNumber || undefined,
      driverName: driverName || undefined,
      convoyeurName: convoyeurName || undefined,
      departureStation: departureStation || undefined,
      arrivalStation: arrivalStation || undefined,
      totalSeats: Number(totalSeats),
      notes: notes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouveau départ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Planifier un départ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Ligne *</Label>
            <Select value={lineCode} onValueChange={setLineCode}>
              <SelectTrigger><SelectValue placeholder="Choisir une ligne (obligatoire)" /></SelectTrigger>
              <SelectContent>
                {lines?.map((l) => (
                  <SelectItem key={l.id} value={l.code}>{l.code} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lines?.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Aucune ligne configurée. Créez-en une dans Configuration → Lignes avant de planifier un départ.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pays de départ *</Label>
              <Input required value={departureCountry} onChange={(e) => setDepartureCountry(e.target.value)} />
            </div>
            <div>
              <Label>Pays d'arrivée *</Label>
              <Input required value={arrivalCountry} onChange={(e) => setArrivalCountry(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ville de départ *</Label>
              <Input required value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="Abidjan" />
            </div>
            <div>
              <Label>Ville d'arrivée *</Label>
              <Input required value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder="Accra" />
            </div>
          </div>

          <div>
            <Label>Gare de départ</Label>
            <Select value={departureStation} onValueChange={setDepartureStation}>
              <SelectTrigger><SelectValue placeholder="Choisir une gare" /></SelectTrigger>
              <SelectContent>
                {stations?.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name} — {s.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Gare d'arrivée</Label>
            <Select value={arrivalStation} onValueChange={setArrivalStation}>
              <SelectTrigger><SelectValue placeholder="Choisir une gare" /></SelectTrigger>
              <SelectContent>
                {stations?.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name} — {s.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Date *</Label>
              <Input required type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
            </div>
            <div>
              <Label>Heure de départ *</Label>
              <Input required type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
            </div>
            <div>
              <Label>Heure d'arrivée estimée</Label>
              <Input type="time" value={estimatedArrivalTime} onChange={(e) => setEstimatedArrivalTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Bus</Label>
            <Select value={busNumber} onValueChange={setBusNumber}>
              <SelectTrigger><SelectValue placeholder="Choisir un bus" /></SelectTrigger>
              <SelectContent>
                {buses?.map((b) => (
                  <SelectItem key={b.id} value={b.busNumber}>{b.busNumber} ({b.totalSeats} places)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Chauffeur</Label>
              <Select value={driverName} onValueChange={setDriverName}>
                <SelectTrigger><SelectValue placeholder="Choisir un chauffeur" /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Convoyeur</Label>
              <Select value={convoyeurName} onValueChange={setConvoyeurName}>
                <SelectTrigger><SelectValue placeholder="Choisir un convoyeur" /></SelectTrigger>
                <SelectContent>
                  {convoyeurs.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nombre de places *</Label>
            <Input required type="number" min="1" value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} />
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={createDeparture.isPending || !lineCode}>
              {createDeparture.isPending ? "Création..." : "Créer le départ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Departures() {
  const { data: departures, isLoading } = trpc.departures.list.useQuery({});

  return (
    <DashboardLayout title="Gestion des Départs">
      <div className="flex justify-end mb-4">
        <CreateDepartureDialog />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Réf.</th>
              <th className="px-4 py-3 font-medium">Trajet</th>
              <th className="px-4 py-3 font-medium">Date / Heure</th>
              <th className="px-4 py-3 font-medium">Bus</th>
              <th className="px-4 py-3 font-medium">Places</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : !departures || departures.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun départ planifié.</td></tr>
            ) : (
              departures.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-mono text-xs">{d.departureRef}</td>
                  <td className="px-4 py-3">{d.departureCity} → {d.arrivalCity}</td>
                  <td className="px-4 py-3">{d.departureDate} {d.departureTime}</td>
                  <td className="px-4 py-3 text-gray-500">{d.busNumber ?? "—"}</td>
                  <td className="px-4 py-3">{d.availableSeats}/{d.totalSeats}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[d.status]}>{STATUS_LABELS[d.status] ?? d.status}</Badge></td>
                  <td className="px-4 py-3">
                    <Link href={`/manifeste/${d.departureRef}`}>
                      <Button size="sm" variant="outline">Manifeste</Button>
                    </Link>
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
