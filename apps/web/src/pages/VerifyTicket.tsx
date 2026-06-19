import { useState } from "react";
import { Ticket, Search as SearchIcon, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";

export default function VerifyTicket() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ticket, isLoading } = trpc.tickets.getByNumber.useQuery(
    { number: searchTerm },
    { enabled: !!searchTerm }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(ticketNumber);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-xl px-4 py-12 flex-1 w-full">
        <div className="text-center mb-8">
          <Ticket className="h-12 w-12 text-mats-purple mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Vérifier un billet</h1>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            placeholder="Ex: TK-A1B2C3D4"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
          />
          <Button type="submit" className="bg-mats-purple hover:bg-mats-purple/90">
            <SearchIcon className="h-4 w-4" />
          </Button>
        </form>

        {isLoading && <p className="text-center text-gray-500">Recherche...</p>}
        {searchTerm && !isLoading && !ticket && (
          <Card className="p-6 text-center">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600">Billet introuvable.</p>
          </Card>
        )}

        {ticket && (
          <Card className="p-6 space-y-3">
            <div className="flex justify-center mb-2">
              {ticket.status === "active" || ticket.status === "used" ? (
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Passager</span><span>{ticket.passengerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Siège</span><span>{ticket.seatNumber ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Statut</span><span className="capitalize">{ticket.status}</span></div>
          </Card>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
