import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SeatPickerProps {
  totalSeats: number;
  occupiedSeats: string[];
  crewSeats: string[];
  selectedSeat: string;
  onSelect: (seat: string) => void;
  isAdmin?: boolean;
}

export default function SeatPicker({
  totalSeats,
  occupiedSeats,
  crewSeats,
  selectedSeat,
  onSelect,
  isAdmin = false,
}: SeatPickerProps) {
  const rows = useMemo(() => {
    const seatsPerRow = 4;
    const rowCount = Math.ceil(totalSeats / seatsPerRow);
    const result: string[][] = [];
    let seatNum = 1;
    for (let r = 0; r < rowCount; r++) {
      const row: string[] = [];
      for (let c = 0; c < seatsPerRow && seatNum <= totalSeats; c++) {
        row.push(String(seatNum));
        seatNum++;
      }
      result.push(row);
    }
    return result;
  }, [totalSeats]);

  function getSeatState(seat: string): "crew" | "occupied" | "selected" | "available" {
    if (selectedSeat === seat) return "selected";
    if (crewSeats.includes(seat)) return "crew";
    if (occupiedSeats.includes(seat)) return "occupied";
    return "available";
  }

  function handleClick(seat: string) {
    const state = getSeatState(seat);
    if (state === "occupied") return;
    if (state === "crew" && !isAdmin) return;
    onSelect(seat === selectedSeat ? "" : seat);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-100 border border-green-400" /> Disponible
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-mats-purple" /> Sélectionné
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-300" /> Occupé
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-400" /> Personnel navigant
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-gray-50 max-h-80 overflow-y-auto">
        <div className="text-center text-xs text-gray-400 mb-3 pb-2 border-b border-dashed">
          Avant du bus / Chauffeur
        </div>

        <div className="space-y-2">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-center gap-2">
              {row.map((seat, colIdx) => {
                const state = getSeatState(seat);
                const isAisleBreak = colIdx === 2;
                return (
                  <div key={seat} className="flex items-center" style={{ marginLeft: isAisleBreak ? "12px" : "0" }}>
                    <button
                      type="button"
                      onClick={() => handleClick(seat)}
                      disabled={state === "occupied" || (state === "crew" && !isAdmin)}
                      title={state === "crew" ? "Réservé au personnel navigant" : state === "occupied" ? "Siège occupé" : "Siège " + seat}
                      className={cn(
                        "h-9 w-9 rounded-md text-xs font-medium border transition-colors flex items-center justify-center",
                        state === "available" && "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 cursor-pointer",
                        state === "selected" && "bg-mats-purple border-mats-purple text-white cursor-pointer",
                        state === "occupied" && "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed",
                        state === "crew" && isAdmin && "bg-red-400 border-red-500 text-white hover:bg-red-500 cursor-pointer",
                        state === "crew" && !isAdmin && "bg-red-200 border-red-300 text-red-700 cursor-not-allowed"
                      )}
                    >
                      {seat}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedSeat && (
        <p className="text-sm text-gray-600">
          Siège sélectionné: <span className="font-semibold text-mats-purple">{selectedSeat}</span>
        </p>
      )}
    </div>
  );
}
