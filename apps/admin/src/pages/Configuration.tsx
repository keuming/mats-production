import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function CreateBusDialog() {
  const [open, setOpen] = useState(false);
  const [busNumber, setBusNumber] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [totalSeats, setTotalSeats] = useState("70");

  const utils = trpc.useUtils();
  const createBus = trpc.config.createBus.useMutation({
    onSuccess: () => {
      toast.success("Bus ajouté");
      utils.config.getBuses.invalidate();
      setOpen(false);
      setBusNumber(""); setLicensePlate(""); setBrand(""); setModel(""); setTotalSeats("70");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createBus.mutate({
      busNumber,
      licensePlate: licensePlate || undefined,
      brand: brand || undefined,
      model: model || undefined,
      totalSeats: Number(totalSeats),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouveau bus
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un bus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Numéro de bus *</Label>
            <Input required value={busNumber} onChange={(e) => setBusNumber(e.target.value)} placeholder="MATS-004" />
          </div>
          <div>
            <Label>Plaque d'immatriculation</Label>
            <Input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marque</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Mercedes" />
            </div>
            <div>
              <Label>Modèle</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Sprinter" />
            </div>
          </div>
          <div>
            <Label>Nombre de places *</Label>
            <Input required type="number" min="1" value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={createBus.isPending}>
              {createBus.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateStationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Bénin");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const utils = trpc.useUtils();
  const createStation = trpc.config.createStation.useMutation({
    onSuccess: () => {
      toast.success("Gare ajoutée");
      utils.config.getStations.invalidate();
      setOpen(false);
      setName(""); setCity(""); setAddress(""); setPhone("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createStation.mutate({ name, city, country, address: address || undefined, phone: phone || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouvelle gare
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une gare</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nom de la gare *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Gare MATS Abidjan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ville *</Label>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Pays *</Label>
              <Input required value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={createStation.isPending}>
              {createStation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateBusLineDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"national" | "international">("national");

  const utils = trpc.useUtils();
  const createLine = trpc.config.createBusLine.useMutation({
    onSuccess: () => {
      toast.success("Ligne ajoutée");
      utils.config.getBusLines.invalidate();
      setOpen(false);
      setCode(""); setName("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createLine.mutate({ code, name, type });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouvelle ligne
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une ligne</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Code de ligne *</Label>
            <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABJ-ACC" />
          </div>
          <div>
            <Label>Nom *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Abidjan - Accra" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="national">National</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={createLine.isPending}>
              {createLine.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateFareDialog() {
  const [open, setOpen] = useState(false);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [priceXof, setPriceXof] = useState("");
  const [lineCode, setLineCode] = useState("");

  const utils = trpc.useUtils();
  const { data: lines } = trpc.config.getBusLines.useQuery();
  const upsertFare = trpc.config.upsertRouteFare.useMutation({
    onSuccess: () => {
      toast.success("Tarif enregistré");
      utils.config.getRouteFares.invalidate();
      setOpen(false);
      setFromCity(""); setToCity(""); setPriceXof(""); setLineCode("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    upsertFare.mutate({ fromCity, toCity, priceXof, lineCode: lineCode || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouveau tarif
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un tarif</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ville de départ *</Label>
              <Input required value={fromCity} onChange={(e) => setFromCity(e.target.value)} />
            </div>
            <div>
              <Label>Ville d'arrivée *</Label>
              <Input required value={toCity} onChange={(e) => setToCity(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Prix (XOF) *</Label>
            <Input required type="number" min="0" value={priceXof} onChange={(e) => setPriceXof(e.target.value)} />
          </div>
          <div>
            <Label>Ligne (optionnel)</Label>
            <Select value={lineCode} onValueChange={setLineCode}>
              <SelectTrigger><SelectValue placeholder="Aucune ligne" /></SelectTrigger>
              <SelectContent>
                {lines?.map((l) => (
                  <SelectItem key={l.id} value={l.code}>{l.code} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={upsertFare.isPending}>
              {upsertFare.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateStopDialog() {
  const [open, setOpen] = useState(false);
  const [lineCode, setLineCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [city, setCity] = useState("");
  const [orderIndex, setOrderIndex] = useState("1");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  const utils = trpc.useUtils();
  const { data: lines } = trpc.config.getBusLines.useQuery();
  const createStop = trpc.config.createStop.useMutation({
    onSuccess: () => {
      toast.success("Arrêt ajouté");
      utils.config.getStops.invalidate();
      setOpen(false);
      setStationName(""); setCity(""); setOrderIndex("1"); setEstimatedMinutes("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createStop.mutate({
      lineCode,
      stationName,
      city,
      orderIndex: Number(orderIndex),
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-mats-purple hover:bg-mats-purple/90">
          <Plus className="h-4 w-4 mr-2" /> Nouvel arrêt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un arrêt intermédiaire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Ligne *</Label>
            <Select value={lineCode} onValueChange={setLineCode}>
              <SelectTrigger><SelectValue placeholder="Choisir une ligne" /></SelectTrigger>
              <SelectContent>
                {lines?.map((l) => (
                  <SelectItem key={l.id} value={l.code}>{l.code} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nom de l'arrêt *</Label>
            <Input required value={stationName} onChange={(e) => setStationName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ville *</Label>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Ordre dans le trajet *</Label>
              <Input required type="number" min="1" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Temps estimé depuis le départ (minutes)</Label>
            <Input type="number" min="0" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90" disabled={createStop.isPending || !lineCode}>
              {createStop.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Configuration() {
  const { data: buses, isLoading: loadingBuses } = trpc.config.getBuses.useQuery();
  const { data: stations, isLoading: loadingStations } = trpc.config.getStations.useQuery();
  const { data: fares, isLoading: loadingFares } = trpc.config.getRouteFares.useQuery();
  const { data: lines, isLoading: loadingLines } = trpc.config.getBusLines.useQuery();
  const { data: stops, isLoading: loadingStops } = trpc.config.getStops.useQuery({});

  return (
    <DashboardLayout title="Configuration">
      <Tabs defaultValue="buses">
        <TabsList>
          <TabsTrigger value="buses">Bus</TabsTrigger>
          <TabsTrigger value="stations">Gares</TabsTrigger>
          <TabsTrigger value="fares">Tarifs</TabsTrigger>
          <TabsTrigger value="lines">Lignes</TabsTrigger>
          <TabsTrigger value="stops">Arrêts</TabsTrigger>
        </TabsList>

        <TabsContent value="buses">
          <div className="flex justify-end mt-4 mb-2">
            <CreateBusDialog />
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">N° Bus</th>
                  <th className="px-4 py-3 font-medium">Plaque</th>
                  <th className="px-4 py-3 font-medium">Places</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingBuses ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !buses?.length ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucun bus enregistré.</td></tr>
                ) : (
                  buses.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3">{b.busNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{b.licensePlate ?? "—"}</td>
                      <td className="px-4 py-3">{b.totalSeats}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="stations">
          <div className="flex justify-end mt-4 mb-2">
            <CreateStationDialog />
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Pays</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingStations ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !stations?.length ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucune gare enregistrée.</td></tr>
                ) : (
                  stations.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.city}</td>
                      <td className="px-4 py-3 text-gray-500">{s.country}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="fares">
          <div className="flex justify-end mt-4 mb-2">
            <CreateFareDialog />
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Trajet</th>
                  <th className="px-4 py-3 font-medium">Prix XOF</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingFares ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !fares?.length ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Aucun tarif configuré.</td></tr>
                ) : (
                  fares.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-3">{f.fromCity} → {f.toCity}</td>
                      <td className="px-4 py-3 font-medium">{f.priceXof}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="lines">
          <div className="flex justify-end mt-4 mb-2">
            <CreateBusLineDialog />
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingLines ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !lines?.length ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucune ligne configurée.</td></tr>
                ) : (
                  lines.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                      <td className="px-4 py-3">{l.name}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{l.type}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="stops">
          <div className="flex justify-end mt-4 mb-2">
            <CreateStopDialog />
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Ligne</th>
                  <th className="px-4 py-3 font-medium">Arrêt</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Ordre</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingStops ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : !stops?.length ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucun arrêt configuré.</td></tr>
                ) : (
                  stops.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-mono text-xs">{s.lineCode}</td>
                      <td className="px-4 py-3">{s.stationName}</td>
                      <td className="px-4 py-3 text-gray-500">{s.city}</td>
                      <td className="px-4 py-3">{s.orderIndex}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
