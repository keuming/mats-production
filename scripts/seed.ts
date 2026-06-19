/**
 * Script de seed — données de démarrage MATS
 * Usage: DATABASE_URL=postgresql://... npx tsx scripts/seed.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../packages/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  console.log("🚌 Seeding bus lines...");
  await db.insert(schema.busLines).values([
    { code: "ABJ-ACC", name: "Abidjan - Accra", type: "international" },
    { code: "COT-LOM", name: "Cotonou - Lomé", type: "international" },
    { code: "PNO-COT", name: "Porto-Novo - Cotonou", type: "national" },
    { code: "OUA-BKO", name: "Ouagadougou - Bamako", type: "international" },
  ]).onConflictDoNothing();

  console.log("💰 Seeding route fares...");
  await db.insert(schema.routeFares).values([
    { fromCity: "Abidjan", toCity: "Accra", priceXof: "15000", lineCode: "ABJ-ACC" },
    { fromCity: "Cotonou", toCity: "Lomé", priceXof: "8000", lineCode: "COT-LOM" },
    { fromCity: "Porto-Novo", toCity: "Cotonou", priceXof: "2000", lineCode: "PNO-COT" },
    { fromCity: "Ouagadougou", toCity: "Bamako", priceXof: "20000", lineCode: "OUA-BKO" },
  ]).onConflictDoNothing();

  console.log("🚏 Seeding stations...");
  await db.insert(schema.stations).values([
    { name: "Gare MATS Abidjan", city: "Abidjan", country: "Côte d'Ivoire" },
    { name: "Gare MATS Accra", city: "Accra", country: "Ghana" },
    { name: "Gare MATS Cotonou", city: "Cotonou", country: "Bénin" },
    { name: "Gare MATS Lomé", city: "Lomé", country: "Togo" },
    { name: "Gare MATS Ouagadougou", city: "Ouagadougou", country: "Burkina Faso" },
    { name: "Gare MATS Bamako", city: "Bamako", country: "Mali" },
  ]).onConflictDoNothing();

  console.log("🚌 Seeding buses...");
  await db.insert(schema.buses).values([
    { busNumber: "MATS-001", totalSeats: 70, brand: "Mercedes", model: "Sprinter" },
    { busNumber: "MATS-002", totalSeats: 70, brand: "Mercedes", model: "Sprinter" },
    { busNumber: "MATS-003", totalSeats: 45, brand: "Toyota", model: "Coaster" },
  ]).onConflictDoNothing();

  console.log("✅ Seed terminé !");
}

main().catch((err) => {
  console.error("❌ Erreur seed:", err);
  process.exit(1);
});
