import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./trpc";
import { getDb, users, trips, tickets, shipments, staff, transactions, charges, departures,
  buses, stations, stops, staffProfiles, bookings, seatLocks, routeFares, busLines,
  stationCashRegisters, cashierProfiles, luggageTickets, passengerBaggage, clientProfiles,
  loyaltyPoints, clientDiscounts, auditLogs, exchangeRates } from "@mats/db";
import { eq, and, desc, asc, sql, inArray, like, or, gt, lt, ne, isNull, not } from "drizzle-orm";
import { createSessionToken, hashPassword, verifyPassword, emailToOpenId } from "./lib/auth";
import { nanoid } from "nanoid";

const db = getDb();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CREW_SEATS = new Set(["1", "2", "3"]);
function genRef(prefix: string): string {
  return `${prefix}-${nanoid(8).toUpperCase()}`;
}

// ─── Root router ─────────────────────────────────────────────────────────────
export const appRouter = router({

  // ─── Auth ─────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const found = await db.select().from(users)
          .where(eq(users.email, input.email)).limit(1);
        const user = found[0];
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });

        // Check client profiles too
        if (!user.openId.startsWith("admin_") && !user.openId.startsWith("staff_")) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Compte non autorisé pour ce tableau de bord" });
        }

        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Utilisez /auth/staff/login" });
      }),

    staffLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const found = await db.select().from(users)
          .where(eq(users.email, input.email)).limit(1);
        const user = found[0];
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
        if (!user.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "Compte désactivé" });
        if (!user.dashboardApproved && user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Votre accès au tableau de bord n'a pas encore été approuvé" });
        }

        // Verify password stored in openId field (temporary) or via bcrypt check
        // The openId field contains "email_{base64}" for email-based users
        const openIdExpected = emailToOpenId(input.email);
        const isPasswordHash = user.openId.startsWith("$2");
        if (!isPasswordHash) {
          // Legacy: openId-based users need password reset
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Veuillez réinitialiser votre mot de passe" });
        }

        const valid = await verifyPassword(input.password, user.openId);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });

        const token = await createSessionToken({
          userId: user.id,
          email: user.email ?? "",
          role: user.role,
          name: user.name ?? "",
        });

        // Update last signed in
        await db.update(users).set({ lastSignedIn: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));

        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    createAdminAccount: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
        setupKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.setupKey !== process.env.SETUP_KEY) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Clé de configuration invalide" });
        }
        // Check if admin already exists
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Cet email est déjà utilisé" });

        const passwordHash = await hashPassword(input.password);
        const [newUser] = await db.insert(users).values({
          openId: passwordHash, // Store bcrypt hash in openId for staff
          email: input.email,
          name: input.name,
          loginMethod: "email",
          role: "admin",
          isActive: true,
          dashboardApproved: true,
          dashboardApprovedAt: new Date(),
          lastSignedIn: new Date(),
        }).returning();

        const token = await createSessionToken({
          userId: newUser.id,
          email: newUser.email ?? "",
          role: "admin",
          name: newUser.name ?? "",
        });
        return { token, user: newUser };
      }),

    registerStaff: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Cet email est déjà utilisé" });

        const passwordHash = await hashPassword(input.password);
        const [newUser] = await db.insert(users).values({
          openId: passwordHash,
          email: input.email,
          name: input.name,
          loginMethod: "email",
          role: "user",
          isActive: true,
          dashboardApproved: false,
          lastSignedIn: new Date(),
        }).returning();

        return { success: true, message: "Compte créé. En attente d'approbation par un administrateur." };
      }),
  }),

  // ─── Dashboard Stats ──────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const [ticketCount, shipmentCount, todayRevenue] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(tickets)
          .where(eq(tickets.status, "active")),
        db.select({ count: sql<number>`count(*)` }).from(shipments)
          .where(eq(shipments.status, "registered")),
        db.select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` }).from(transactions)
          .where(and(
            eq(transactions.type, "income"),
            sql`created_at >= CURRENT_DATE`
          )),
      ]);
      return {
        activeTickets: Number(ticketCount[0]?.count ?? 0),
        pendingShipments: Number(shipmentCount[0]?.count ?? 0),
        todayRevenue: todayRevenue[0]?.total ?? "0",
      };
    }),
  }),

  // ─── Trips ────────────────────────────────────────────────────────────────
  trips: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        date: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        let query = db.select().from(trips).$dynamic();
        const conds = [];
        if (input?.status && input.status !== "all") conds.push(eq(trips.status, input.status as any));
        if (input?.date) conds.push(eq(trips.departureDate, input.date));
        if (input?.search) conds.push(or(
          like(trips.departureCity, `%${input.search}%`),
          like(trips.arrivalCity, `%${input.search}%`),
          like(trips.tripNumber, `%${input.search}%`)
        ));
        if (conds.length) query = query.where(and(...conds));
        return query.orderBy(desc(trips.departureDate));
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const [trip] = await db.select().from(trips).where(eq(trips.id, input.id)).limit(1);
        return trip ?? null;
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["national", "international"]).default("national"),
        departureCity: z.string().min(1),
        arrivalCity: z.string().min(1),
        departureCountry: z.string().default("Bénin"),
        arrivalCountry: z.string().default("Bénin"),
        departureDate: z.string(),
        departureTime: z.string(),
        estimatedArrivalTime: z.string().optional(),
        busNumber: z.string().optional(),
        driverName: z.string().optional(),
        totalSeats: z.number().int().min(1).max(100).default(45),
        priceGhs: z.string(),
        priceXof: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tripNumber = genRef("TR");
        const [trip] = await db.insert(trips).values({
          ...input,
          tripNumber,
          availableSeats: input.totalSeats,
          createdBy: ctx.user.id,
        }).returning();
        return trip;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["scheduled", "boarding", "departed", "arrived", "cancelled"]).optional(),
          departureDate: z.string().optional(),
          departureTime: z.string().optional(),
          busNumber: z.string().optional(),
          driverName: z.string().optional(),
          notes: z.string().optional(),
          priceGhs: z.string().optional(),
          priceXof: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.update(trips).set({ ...input.data, updatedAt: new Date() })
          .where(eq(trips.id, input.id));
        const [updated] = await db.select().from(trips).where(eq(trips.id, input.id)).limit(1);
        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(trips).where(eq(trips.id, input.id));
        return { success: true };
      }),

    // Public search
    search: publicProcedure
      .input(z.object({
        from: z.string(),
        to: z.string(),
        date: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const conds = [
          eq(trips.status, "scheduled"),
          like(trips.departureCity, `%${input.from}%`),
          like(trips.arrivalCity, `%${input.to}%`),
        ];
        if (input.date) conds.push(eq(trips.departureDate, input.date));
        return db.select().from(trips).where(and(...conds))
          .orderBy(asc(trips.departureDate), asc(trips.departureTime));
      }),
  }),

  // ─── Departures ───────────────────────────────────────────────────────────
  departures: router({
    list: protectedProcedure
      .input(z.object({
        date: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conds = [];
        if (input?.date) conds.push(eq(departures.departureDate, input.date));
        if (input?.status && input.status !== "all") conds.push(eq(departures.status, input.status as any));
        return db.select().from(departures)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(asc(departures.departureDate), asc(departures.departureTime));
      }),

    publicList: publicProcedure
      .input(z.object({
        date: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conds = [
          sql`${departures.departureDate} >= CURRENT_DATE`,
          ne(departures.status, "cancelled"),
        ];
        if (input?.date) conds.push(eq(departures.departureDate, input.date));
        if (input?.from) conds.push(like(departures.departureCity, `%${input.from}%`));
        if (input?.to) conds.push(like(departures.arrivalCity, `%${input.to}%`));
        return db.select({
          id: departures.id,
          departureRef: departures.departureRef,
          departureCity: departures.departureCity,
          arrivalCity: departures.arrivalCity,
          departureDate: departures.departureDate,
          departureTime: departures.departureTime,
          estimatedArrivalTime: departures.estimatedArrivalTime,
          departureStation: departures.departureStation,
          arrivalStation: departures.arrivalStation,
          status: departures.status,
          // Show available seats minus crew
          availableSeats: sql<number>`GREATEST(0, ${departures.availableSeats} - 3)`,
          totalSeats: departures.totalSeats,
        }).from(departures).where(and(...conds))
          .orderBy(asc(departures.departureDate), asc(departures.departureTime));
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const [d] = await db.select().from(departures).where(eq(departures.id, input.id)).limit(1);
        return d ?? null;
      }),

    getByRef: publicProcedure
      .input(z.object({ ref: z.string() }))
      .query(async ({ input }) => {
        const [d] = await db.select().from(departures)
          .where(eq(departures.departureRef, input.ref)).limit(1);
        return d ?? null;
      }),

    create: protectedProcedure
      .input(z.object({
        lineCode: z.string().optional(),
        departureCity: z.string().min(1),
        arrivalCity: z.string().min(1),
        departureDate: z.string(),
        departureTime: z.string(),
        estimatedArrivalTime: z.string().optional(),
        busId: z.number().optional(),
        busNumber: z.string().optional(),
        driverId: z.number().optional(),
        driverName: z.string().optional(),
        departureStationId: z.number().optional(),
        departureStation: z.string().optional(),
        arrivalStationId: z.number().optional(),
        arrivalStation: z.string().optional(),
        totalSeats: z.number().int().default(70),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const departureRef = genRef("DEP");
        const [dep] = await db.insert(departures).values({
          ...input,
          departureRef,
          availableSeats: input.totalSeats,
          createdBy: ctx.user.id,
        }).returning();
        return dep;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["scheduled", "boarding", "departed", "arrived", "cancelled"]).optional(),
          busId: z.number().optional(),
          busNumber: z.string().optional(),
          driverName: z.string().optional(),
          departureDate: z.string().optional(),
          departureTime: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.update(departures).set({ ...input.data, updatedAt: new Date() })
          .where(eq(departures.id, input.id));
        const [updated] = await db.select().from(departures).where(eq(departures.id, input.id)).limit(1);
        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(departures).where(eq(departures.id, input.id));
        return { success: true };
      }),

    close: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.update(departures).set({
          isClosed: true,
          closedAt: new Date(),
          closedBy: ctx.user.id,
          updatedAt: new Date(),
        }).where(eq(departures.id, input.id));
        return { success: true };
      }),

    weeklyFillRate: protectedProcedure.query(async () => {
      const result = await db.select({
        departureRef: departures.departureRef,
        departureCity: departures.departureCity,
        arrivalCity: departures.arrivalCity,
        departureDate: departures.departureDate,
        totalSeats: departures.totalSeats,
        availableSeats: departures.availableSeats,
        soldSeats: sql<number>`${departures.totalSeats} - ${departures.availableSeats}`,
      }).from(departures)
        .where(sql`${departures.departureDate} >= CURRENT_DATE - INTERVAL '7 days'`)
        .orderBy(desc(departures.departureDate));
      return result;
    }),
  }),

  // ─── Tickets ──────────────────────────────────────────────────────────────
  tickets: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        departureRef: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conds = [];
        if (input?.status && input.status !== "all") conds.push(eq(tickets.status, input.status as any));
        if (input?.departureRef) conds.push(eq(tickets.departureRef, input.departureRef));
        if (input?.search) conds.push(or(
          like(tickets.passengerName, `%${input.search}%`),
          like(tickets.passengerPhone, `%${input.search}%`),
          like(tickets.ticketNumber, `%${input.search}%`)
        ));
        let query = db.select().from(tickets)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(tickets.issuedAt));
        if (input?.limit) query = query.limit(input.limit);
        return query;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const [t] = await db.select().from(tickets).where(eq(tickets.id, input.id)).limit(1);
        return t ?? null;
      }),

    getByNumber: protectedProcedure
      .input(z.object({ number: z.string() }))
      .query(async ({ input }) => {
        const [t] = await db.select().from(tickets)
          .where(eq(tickets.ticketNumber, input.number)).limit(1);
        return t ?? null;
      }),

    create: protectedProcedure
      .input(z.object({
        tripId: z.number().optional(),
        departureRef: z.string().optional(),
        passengerName: z.string().min(2),
        passengerPhone: z.string().min(8),
        emergencyPhone: z.string().optional(),
        passengerIdType: z.enum(["passport", "national_id", "consular_card", "resident_card", "laissez_passer", "other"]).optional(),
        passengerIdNumber: z.string().optional(),
        passengerGender: z.enum(["male", "female", "other"]).optional(),
        seatNumber: z.string().optional(),
        destinationCity: z.string().optional(),
        dropOffStop: z.string().optional(),
        luggageCount: z.number().default(0),
        pricePaid: z.string(),
        currency: z.string().default("XOF"),
        paymentMethod: z.enum(["cash", "mobile_money", "card", "transfer"]).default("cash"),
        paymentStatus: z.enum(["pending", "paid"]).default("paid"),
      }))
      .mutation(async ({ input, ctx }) => {
        const ticketNumber = genRef("TK");

        // Validate seat not taken
        if (input.seatNumber && CREW_SEATS.has(input.seatNumber)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ce siège est réservé au personnel" });
        }

        const [ticket] = await db.insert(tickets).values({
          ...input,
          ticketNumber,
          paidAt: input.paymentStatus === "paid" ? new Date() : null,
          issuedBy: ctx.user.id,
        }).returning();

        // Decrement available seats if linked to departure
        if (input.departureRef) {
          await db.update(departures)
            .set({ availableSeats: sql`GREATEST(0, ${departures.availableSeats} - 1)`, updatedAt: new Date() })
            .where(eq(departures.departureRef, input.departureRef));
        } else if (input.tripId) {
          await db.update(trips)
            .set({ availableSeats: sql`GREATEST(0, ${trips.availableSeats} - 1)`, updatedAt: new Date() })
            .where(eq(trips.id, input.tripId));
        }

        // Create income transaction
        await db.insert(transactions).values({
          type: "income",
          category: "ticket_sale",
          amount: input.pricePaid,
          currency: input.currency,
          reference: ticketNumber,
          description: `Billet ${ticketNumber} - ${input.passengerName}`,
          createdBy: ctx.user.id,
        });

        return ticket;
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.id)).limit(1);
        if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

        await db.update(tickets).set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(tickets.id, input.id));

        // Restore seat
        if (ticket.departureRef) {
          await db.update(departures)
            .set({ availableSeats: sql`${departures.availableSeats} + 1`, updatedAt: new Date() })
            .where(eq(departures.departureRef, ticket.departureRef));
        }
        return { success: true };
      }),

    encash: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.update(tickets)
          .set({ paymentStatus: "paid", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(tickets.id, input.id));
        return { success: true };
      }),

    board: protectedProcedure
      .input(z.object({ ticketNumber: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const [ticket] = await db.select().from(tickets)
          .where(eq(tickets.ticketNumber, input.ticketNumber)).limit(1);
        if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Billet introuvable" });
        if (ticket.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: `Billet ${ticket.status}` });
        if (ticket.boardedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Passager déjà embarqué" });

        await db.update(tickets).set({
          boardedAt: new Date(),
          boardedBy: ctx.user.id,
          status: "used",
          updatedAt: new Date(),
        }).where(eq(tickets.ticketNumber, input.ticketNumber));

        return { success: true, passengerName: ticket.passengerName, seatNumber: ticket.seatNumber };
      }),

    getPending: protectedProcedure.query(async () => {
      return db.select().from(tickets)
        .where(eq(tickets.paymentStatus, "pending"))
        .orderBy(desc(tickets.issuedAt))
        .limit(100);
    }),
  }),

  // ─── Shipments ────────────────────────────────────────────────────────────
  shipments: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conds = [];
        if (input?.status && input.status !== "all") conds.push(eq(shipments.status, input.status as any));
        if (input?.search) conds.push(or(
          like(shipments.trackingNumber, `%${input.search}%`),
          like(shipments.senderName, `%${input.search}%`),
          like(shipments.recipientName, `%${input.search}%`)
        ));
        return db.select().from(shipments)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(shipments.registeredAt))
          .limit(200);
      }),

    track: publicProcedure
      .input(z.object({ trackingNumber: z.string() }))
      .query(async ({ input }) => {
        const [s] = await db.select({
          trackingNumber: shipments.trackingNumber,
          status: shipments.status,
          originCity: shipments.originCity,
          destinationCity: shipments.destinationCity,
          description: shipments.description,
          registeredAt: shipments.registeredAt,
          deliveredAt: shipments.deliveredAt,
        }).from(shipments)
          .where(eq(shipments.trackingNumber, input.trackingNumber)).limit(1);
        return s ?? null;
      }),

    create: protectedProcedure
      .input(z.object({
        tripId: z.number().optional(),
        departureRef: z.string().optional(),
        senderName: z.string().min(2),
        senderPhone: z.string().min(8),
        recipientName: z.string().min(2),
        recipientPhone: z.string().min(8),
        originCity: z.string().min(1),
        destinationCity: z.string().min(1),
        description: z.string().optional(),
        weight: z.string().optional(),
        quantity: z.number().default(1),
        pricePaid: z.string(),
        currency: z.string().default("XOF"),
        paymentMethod: z.enum(["cash", "mobile_money", "card", "transfer"]).default("cash"),
        paymentStatus: z.enum(["pending", "paid"]).default("paid"),
      }))
      .mutation(async ({ input, ctx }) => {
        const trackingNumber = genRef("EXP");
        const [shipment] = await db.insert(shipments).values({
          ...input,
          trackingNumber,
          paidAt: input.paymentStatus === "paid" ? new Date() : null,
          registeredBy: ctx.user.id,
        }).returning();

        // Create income transaction
        await db.insert(transactions).values({
          type: "income",
          category: "shipment_fee",
          amount: input.pricePaid,
          currency: input.currency,
          reference: trackingNumber,
          description: `Expédition ${trackingNumber} - ${input.senderName} → ${input.recipientName}`,
          createdBy: ctx.user.id,
        });

        return shipment;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["registered", "in_transit", "delivered", "returned", "lost"]),
      }))
      .mutation(async ({ input }) => {
        await db.update(shipments).set({
          status: input.status,
          deliveredAt: input.status === "delivered" ? new Date() : null,
          updatedAt: new Date(),
        }).where(eq(shipments.id, input.id));
        return { success: true };
      }),

    encash: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.update(shipments)
          .set({ paymentStatus: "paid", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(shipments.id, input.id));
        return { success: true };
      }),

    getPending: protectedProcedure.query(async () => {
      return db.select().from(shipments)
        .where(eq(shipments.paymentStatus, "pending"))
        .orderBy(desc(shipments.registeredAt));
    }),
  }),

  // ─── Finance ──────────────────────────────────────────────────────────────
  finance: router({
    summary: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        stationId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conds = [];
        if (input?.startDate) conds.push(sql`${transactions.createdAt} >= ${input.startDate}::date`);
        if (input?.endDate) conds.push(sql`${transactions.createdAt} <= ${input.endDate}::date + INTERVAL '1 day'`);

        const result = await db.select({
          type: transactions.type,
          total: sql<string>`COALESCE(SUM(amount::numeric), 0)`,
        }).from(transactions)
          .where(conds.length ? and(...conds) : undefined)
          .groupBy(transactions.type);

        const income = result.find(r => r.type === "income")?.total ?? "0";
        const expense = result.find(r => r.type === "expense")?.total ?? "0";
        return { income, expense, net: (parseFloat(income) - parseFloat(expense)).toFixed(2) };
      }),

    transactions: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
        limit: z.number().default(100),
      }).optional())
      .query(async ({ input }) => {
        const conds = [];
        if (input?.type) conds.push(eq(transactions.type, input.type));
        if (input?.startDate) conds.push(sql`${transactions.createdAt} >= ${input.startDate}::date`);
        if (input?.endDate) conds.push(sql`${transactions.createdAt} <= ${input.endDate}::date + INTERVAL '1 day'`);
        return db.select().from(transactions)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(transactions.createdAt))
          .limit(input?.limit ?? 100);
      }),

    createTransaction: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        category: z.enum(["ticket_sale", "shipment_fee", "passenger_baggage", "fuel", "maintenance", "salary", "toll", "other_income", "other_expense"]),
        amount: z.string(),
        currency: z.string().default("XOF"),
        description: z.string().optional(),
        reference: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const [tx] = await db.insert(transactions).values({
          ...input,
          createdBy: ctx.user.id,
        }).returning();
        return tx;
      }),
  }),

  // ─── Charges ──────────────────────────────────────────────────────────────
  charges: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const conds = input?.status && input.status !== "all"
          ? [eq(charges.status, input.status as any)] : [];
        return db.select().from(charges)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(charges.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.string().min(2),
        description: z.string().optional(),
        amount: z.string(),
        currency: z.string().default("XOF"),
        departureRef: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const [charge] = await db.insert(charges).values({
          ...input,
          createdBy: ctx.user.id,
        }).returning();
        return charge;
      }),

    disburse: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const [charge] = await db.select().from(charges).where(eq(charges.id, input.id)).limit(1);
        if (!charge) throw new TRPCError({ code: "NOT_FOUND" });

        await db.update(charges).set({
          status: "paid",
          paidAt: new Date(),
          paidBy: ctx.user.id,
          updatedAt: new Date(),
        }).where(eq(charges.id, input.id));

        // Create expense transaction
        await db.insert(transactions).values({
          type: "expense",
          category: "other_expense",
          amount: charge.amount,
          currency: charge.currency,
          description: `Charge: ${charge.type} - ${charge.description ?? ""}`,
          createdBy: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  // ─── Configuration ────────────────────────────────────────────────────────
  config: router({
    getBuses: protectedProcedure.query(async () => {
      return db.select().from(buses).where(eq(buses.isActive, true)).orderBy(asc(buses.busNumber));
    }),

    createBus: adminProcedure
      .input(z.object({
        busNumber: z.string().min(1),
        licensePlate: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        totalSeats: z.number().int().min(1).default(70),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [bus] = await db.insert(buses).values(input).returning();
        return bus;
      }),

    updateBus: adminProcedure
      .input(z.object({ id: z.number(), data: z.object({
        busNumber: z.string().optional(),
        licensePlate: z.string().optional(),
        totalSeats: z.number().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }) }))
      .mutation(async ({ input }) => {
        await db.update(buses).set({ ...input.data, updatedAt: new Date() }).where(eq(buses.id, input.id));
        return { success: true };
      }),

    deleteBus: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.update(buses).set({ isActive: false, updatedAt: new Date() }).where(eq(buses.id, input.id));
        return { success: true };
      }),

    getStations: protectedProcedure.query(async () => {
      return db.select().from(stations).where(eq(stations.isActive, true)).orderBy(asc(stations.name));
    }),

    createStation: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        city: z.string().min(2),
        country: z.string().default("Bénin"),
        address: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [station] = await db.insert(stations).values(input).returning();
        return station;
      }),

    updateStation: adminProcedure
      .input(z.object({ id: z.number(), data: z.object({
        name: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
      }) }))
      .mutation(async ({ input }) => {
        await db.update(stations).set({ ...input.data, updatedAt: new Date() }).where(eq(stations.id, input.id));
        return { success: true };
      }),

    getStaff: protectedProcedure.query(async () => {
      return db.select().from(staff).orderBy(asc(staff.name));
    }),

    createStaff: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        phone: z.string().min(8),
        email: z.string().email().optional(),
        role: z.enum(["driver", "agent", "supervisor", "accountant", "mechanic", "other"]),
        station: z.string().optional(),
        salary: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const employeeId = genRef("EMP");
        const [s] = await db.insert(staff).values({ ...input, employeeId }).returning();
        return s;
      }),

    updateStaff: adminProcedure
      .input(z.object({ id: z.number(), data: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["driver", "agent", "supervisor", "accountant", "mechanic", "other"]).optional(),
        station: z.string().optional(),
        isActive: z.boolean().optional(),
      }) }))
      .mutation(async ({ input }) => {
        await db.update(staff).set({ ...input.data, updatedAt: new Date() }).where(eq(staff.id, input.id));
        return { success: true };
      }),

    getRouteFares: protectedProcedure.query(async () => {
      return db.select().from(routeFares).where(eq(routeFares.isActive, true)).orderBy(asc(routeFares.fromCity));
    }),

    upsertRouteFare: adminProcedure
      .input(z.object({
        fromCity: z.string().min(1),
        toCity: z.string().min(1),
        priceXof: z.string(),
        priceGhs: z.string().optional(),
        lineCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.select().from(routeFares)
          .where(and(eq(routeFares.fromCity, input.fromCity), eq(routeFares.toCity, input.toCity))).limit(1);
        if (existing[0]) {
          await db.update(routeFares).set({ ...input, updatedAt: new Date() }).where(eq(routeFares.id, existing[0].id));
          return existing[0];
        }
        const [fare] = await db.insert(routeFares).values(input).returning();
        return fare;
      }),

    getBusLines: protectedProcedure.query(async () => {
      return db.select().from(busLines).orderBy(asc(busLines.code));
    }),

    createBusLine: adminProcedure
      .input(z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        type: z.enum(["national", "international"]).default("national"),
      }))
      .mutation(async ({ input }) => {
        const [line] = await db.insert(busLines).values(input).returning();
        return line;
      }),
  }),

  // ─── Staff Management (users/dashboard access) ───────────────────────────
  staffManagement: router({
    list: adminProcedure.query(async () => {
      return db.select().from(users).orderBy(desc(users.createdAt));
    }),

    approve: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]).default("user"),
        staffRole: z.enum(["admin", "caissier", "agent", "operateur"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.update(users).set({
          dashboardApproved: true,
          dashboardApprovedAt: new Date(),
          dashboardApprovedBy: ctx.user.id,
          role: input.role,
          staffRole: input.staffRole,
          updatedAt: new Date(),
        }).where(eq(users.id, input.userId));
        return { success: true };
      }),

    revoke: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.update(users).set({
          dashboardApproved: false,
          isActive: false,
          updatedAt: new Date(),
        }).where(eq(users.id, input.userId));
        return { success: true };
      }),

    setPermissions: adminProcedure
      .input(z.object({
        userId: z.number(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        await db.update(users).set({
          permissions: JSON.stringify(input.permissions),
          updatedAt: new Date(),
        }).where(eq(users.id, input.userId));
        return { success: true };
      }),
  }),

  // ─── Clients (public registration) ───────────────────────────────────────
  clients: router({
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        phone: z.string().optional(),
        country: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.select().from(clientProfiles)
          .where(eq(clientProfiles.email, input.email)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Email déjà utilisé" });

        const passwordHash = await hashPassword(input.password);
        const [client] = await db.insert(clientProfiles).values({
          ...input,
          passwordHash,
        }).returning({ id: clientProfiles.id, email: clientProfiles.email, name: clientProfiles.name });
        return { success: true, client };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const [client] = await db.select().from(clientProfiles)
          .where(eq(clientProfiles.email, input.email)).limit(1);
        if (!client) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
        if (!client.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "Compte désactivé" });

        const valid = await verifyPassword(input.password, client.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });

        const token = await createSessionToken({
          userId: client.id,
          email: client.email,
          role: "user",
          name: client.name,
        });
        return { token, client: { id: client.id, email: client.email, name: client.name } };
      }),

    profile: protectedProcedure.query(async ({ ctx }) => {
      const [c] = await db.select().from(clientProfiles)
        .where(eq(clientProfiles.id, ctx.user.id)).limit(1);
      return c ?? null;
    }),
  }),

  // ─── Bookings (online reservations) ──────────────────────────────────────
  bookings: router({
    create: publicProcedure
      .input(z.object({
        tripId: z.number(),
        passengerName: z.string().min(2),
        passengerPhone: z.string().min(8),
        passengerEmail: z.string().email().optional(),
        seatNumbers: z.array(z.string()).default([]),
        totalAmount: z.string(),
        currency: z.string().default("XOF"),
        paymentMethod: z.enum(["cash", "mobile_money", "card", "transfer"]).default("mobile_money"),
      }))
      .mutation(async ({ input }) => {
        const bookingRef = genRef("BKG");
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        const [booking] = await db.insert(bookings).values({
          ...input,
          bookingRef,
          seatNumbers: JSON.stringify(input.seatNumbers),
          expiresAt,
        }).returning();
        return booking;
      }),

    getByRef: publicProcedure
      .input(z.object({ ref: z.string() }))
      .query(async ({ input }) => {
        const [booking] = await db.select().from(bookings)
          .where(eq(bookings.bookingRef, input.ref)).limit(1);
        return booking ?? null;
      }),

    confirm: publicProcedure
      .input(z.object({ ref: z.string(), paymentProof: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.update(bookings).set({
          status: "confirmed",
          confirmedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(bookings.bookingRef, input.ref));
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const conds = input?.status && input.status !== "all"
          ? [eq(bookings.status, input.status as any)] : [];
        return db.select().from(bookings)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(bookings.createdAt)).limit(200);
      }),
  }),

  // ─── Rates ────────────────────────────────────────────────────────────────
  rates: router({
    getCurrent: publicProcedure.query(async () => {
      const [rate] = await db.select().from(exchangeRates)
        .orderBy(desc(exchangeRates.fetchedAt)).limit(1);
      if (!rate) return { XOF: 1, GHS: 0.054, GNF: 8.5, LRD: 0.43 };
      return JSON.parse(rate.rates);
    }),
  }),

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  audit: router({
    list: adminProcedure
      .input(z.object({
        limit: z.number().default(100),
        userId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conds = input?.userId ? [eq(auditLogs.userId, input.userId)] : [];
        return db.select().from(auditLogs)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(auditLogs.createdAt))
          .limit(input?.limit ?? 100);
      }),
  }),

  // ─── Manifeste ────────────────────────────────────────────────────────────
  manifeste: router({
    get: protectedProcedure
      .input(z.object({ departureRef: z.string() }))
      .query(async ({ input }) => {
        const [dep] = await db.select().from(departures)
          .where(eq(departures.departureRef, input.departureRef)).limit(1);
        if (!dep) throw new TRPCError({ code: "NOT_FOUND" });

        const tks = await db.select().from(tickets)
          .where(and(
            eq(tickets.departureRef, input.departureRef),
            ne(tickets.status, "cancelled")
          ))
          .orderBy(asc(tickets.seatNumber));

        const shs = await db.select().from(shipments)
          .where(eq(shipments.departureRef, input.departureRef));

        return { departure: dep, tickets: tks, shipments: shs };
      }),
  }),

  // ─── Baggage ──────────────────────────────────────────────────────────────
  baggage: router({
    list: protectedProcedure
      .input(z.object({ departureRef: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const conds = input?.departureRef ? [eq(passengerBaggage.departureRef, input.departureRef)] : [];
        return db.select().from(passengerBaggage)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(passengerBaggage.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        ticketNumber: z.string().optional(),
        departureRef: z.string().optional(),
        passengerName: z.string().min(2),
        passengerPhone: z.string().optional(),
        seatNumber: z.string().optional(),
        baggageCount: z.number().int().min(0),
        totalWeight: z.string().optional(),
        pricePaid: z.string().default("0"),
        currency: z.string().default("XOF"),
        paymentMethod: z.enum(["cash", "mobile_money", "card", "transfer"]).default("cash"),
        paymentStatus: z.enum(["pending", "paid"]).default("paid"),
      }))
      .mutation(async ({ input, ctx }) => {
        const [bag] = await db.insert(passengerBaggage).values({
          ...input,
          paidAt: input.paymentStatus === "paid" ? new Date() : null,
          registeredBy: ctx.user.id,
        }).returning();
        return bag;
      }),
  }),
});

export type AppRouter = typeof appRouter;
