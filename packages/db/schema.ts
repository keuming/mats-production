import {
  pgTable, serial, text, varchar, boolean, integer,
  timestamp, date, decimal, pgEnum, uniqueIndex, index
} from "drizzle-orm/pg-core";

// ─── Enums PostgreSQL ────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const staffRoleEnum = pgEnum("staff_role", ["admin", "caissier", "agent", "operateur"]);
export const tripStatusEnum = pgEnum("trip_status", ["scheduled", "boarding", "departed", "arrived", "cancelled"]);
export const tripTypeEnum = pgEnum("trip_type", ["national", "international"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "mobile_money", "card", "transfer"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["active", "used", "cancelled", "refunded"]);
export const shipmentStatusEnum = pgEnum("shipment_status", ["registered", "in_transit", "delivered", "returned", "lost"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionCategoryEnum = pgEnum("transaction_category", [
  "ticket_sale", "shipment_fee", "passenger_baggage",
  "fuel", "maintenance", "salary", "toll", "other_income", "other_expense"
]);
export const chargeStatusEnum = pgEnum("charge_status", ["pending", "paid", "cancelled"]);
export const passengerIdTypeEnum = pgEnum("passenger_id_type", ["passport", "national_id", "consular_card", "resident_card", "laissez_passer", "other"]);
export const passengerGenderEnum = pgEnum("passenger_gender", ["male", "female", "other"]);
export const vaccinationStatusEnum = pgEnum("vaccination_status", ["vaccinated", "not_vaccinated", "unknown"]);
export const staffEmployeeRoleEnum = pgEnum("staff_employee_role", ["driver", "agent", "supervisor", "accountant", "mechanic", "other"]);
export const seatLockStatusEnum = pgEnum("seat_lock_status", ["locked", "released"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "expired"]);
export const luggageStatusEnum = pgEnum("luggage_status", ["registered", "loaded", "delivered"]);
export const auditActionEnum = pgEnum("audit_action", [
  "login", "logout", "create_ticket", "cancel_ticket", "create_shipment",
  "update_shipment", "create_departure", "update_departure", "delete_departure",
  "create_charge", "disburse_charge", "create_booking", "confirm_booking",
  "encash_ticket", "encash_shipment", "board_passenger", "other"
]);

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  staffRole: staffRoleEnum("staff_role"),
  permissions: text("permissions"), // JSON string
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  cashPin: varchar("cash_pin", { length: 64 }),
  dashboardApproved: boolean("dashboard_approved").default(false).notNull(),
  dashboardApprovedAt: timestamp("dashboard_approved_at"),
  dashboardApprovedBy: integer("dashboard_approved_by"),
}, (t) => [
  index("users_email_idx").on(t.email),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Trips ──────────────────────────────────────────────────────────────────
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  tripNumber: varchar("trip_number", { length: 20 }).notNull().unique(),
  type: tripTypeEnum("type").default("national").notNull(),
  departureCity: varchar("departure_city", { length: 100 }).notNull(),
  arrivalCity: varchar("arrival_city", { length: 100 }).notNull(),
  departureCountry: varchar("departure_country", { length: 100 }).default("Bénin").notNull(),
  arrivalCountry: varchar("arrival_country", { length: 100 }).default("Bénin").notNull(),
  departureDate: date("departure_date").notNull(),
  departureTime: varchar("departure_time", { length: 10 }).notNull(),
  estimatedArrivalTime: varchar("estimated_arrival_time", { length: 10 }),
  departureStation: varchar("departure_station", { length: 150 }),
  arrivalStation: varchar("arrival_station", { length: 150 }),
  busNumber: varchar("bus_number", { length: 50 }),
  driverName: varchar("driver_name", { length: 100 }),
  totalSeats: integer("total_seats").default(45).notNull(),
  availableSeats: integer("available_seats").default(45).notNull(),
  priceGhs: decimal("price_ghs", { precision: 10, scale: 2 }).notNull(),
  priceXof: decimal("price_xof", { precision: 10, scale: 2 }),
  status: tripStatusEnum("status").default("scheduled").notNull(),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("trips_date_idx").on(t.departureDate),
  index("trips_status_idx").on(t.status),
]);

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

// ─── Departures ─────────────────────────────────────────────────────────────
export const departures = pgTable("departures", {
  id: serial("id").primaryKey(),
  departureRef: varchar("departure_ref", { length: 30 }).notNull().unique(),
  tripId: integer("trip_id"),
  lineCode: varchar("line_code", { length: 20 }),
  departureCity: varchar("departure_city", { length: 100 }).notNull(),
  arrivalCity: varchar("arrival_city", { length: 100 }).notNull(),
  departureDate: date("departure_date").notNull(),
  departureTime: varchar("departure_time", { length: 10 }).notNull(),
  estimatedArrivalTime: varchar("estimated_arrival_time", { length: 10 }),
  busId: integer("bus_id"),
  busNumber: varchar("bus_number", { length: 50 }),
  driverId: integer("driver_id"),
  driverName: varchar("driver_name", { length: 100 }),
  departureStationId: integer("departure_station_id"),
  departureStation: varchar("departure_station", { length: 150 }),
  arrivalStationId: integer("arrival_station_id"),
  arrivalStation: varchar("arrival_station", { length: 150 }),
  totalSeats: integer("total_seats").default(70).notNull(),
  availableSeats: integer("available_seats").default(70).notNull(),
  status: tripStatusEnum("status").default("scheduled").notNull(),
  notes: text("notes"),
  isClosed: boolean("is_closed").default(false).notNull(),
  closedAt: timestamp("closed_at"),
  closedBy: integer("closed_by"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("departures_date_idx").on(t.departureDate),
  index("departures_status_idx").on(t.status),
]);

export type Departure = typeof departures.$inferSelect;
export type InsertDeparture = typeof departures.$inferInsert;

// ─── Tickets ────────────────────────────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  tripId: integer("trip_id"),
  departureRef: varchar("departure_ref", { length: 30 }),
  passengerName: varchar("passenger_name", { length: 150 }).notNull(),
  passengerPhone: varchar("passenger_phone", { length: 30 }).notNull(),
  emergencyPhone: varchar("emergency_phone", { length: 30 }),
  passengerIdType: passengerIdTypeEnum("passenger_id_type").default("national_id"),
  passengerIdNumber: varchar("passenger_id_number", { length: 50 }),
  passengerDateOfBirth: date("passenger_date_of_birth"),
  passengerNationality: varchar("passenger_nationality", { length: 60 }),
  passengerGender: passengerGenderEnum("passenger_gender"),
  seatNumber: varchar("seat_number", { length: 10 }),
  destinationCity: varchar("destination_city", { length: 100 }),
  dropOffStop: varchar("drop_off_stop", { length: 150 }),
  luggageCount: integer("luggage_count").default(0),
  emergencyContactName: varchar("emergency_contact_name", { length: 150 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 30 }),
  vaccinationStatus: vaccinationStatusEnum("vaccination_status").default("unknown"),
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  status: ticketStatusEnum("status").default("active").notNull(),
  issuedBy: integer("issued_by"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  boardedAt: timestamp("boarded_at"),
  boardedBy: integer("boarded_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("tickets_departure_ref_idx").on(t.departureRef),
  index("tickets_status_idx").on(t.status),
]);

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ─── Shipments ──────────────────────────────────────────────────────────────
export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  trackingNumber: varchar("tracking_number", { length: 20 }).notNull().unique(),
  tripId: integer("trip_id"),
  departureRef: varchar("departure_ref", { length: 30 }),
  senderName: varchar("sender_name", { length: 150 }).notNull(),
  senderPhone: varchar("sender_phone", { length: 30 }).notNull(),
  recipientName: varchar("recipient_name", { length: 150 }).notNull(),
  recipientPhone: varchar("recipient_phone", { length: 30 }).notNull(),
  originCity: varchar("origin_city", { length: 100 }).notNull(),
  destinationCity: varchar("destination_city", { length: 100 }).notNull(),
  description: text("description"),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  cargoValue: decimal("cargo_value", { precision: 12, scale: 2 }),
  quantity: integer("quantity").default(1),
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  status: shipmentStatusEnum("status").default("registered").notNull(),
  registeredBy: integer("registered_by"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  packagePhotoUrl: text("package_photo_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("shipments_status_idx").on(t.status),
]);

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

// ─── Buses ──────────────────────────────────────────────────────────────────
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: varchar("bus_number", { length: 30 }).notNull().unique(),
  licensePlate: varchar("license_plate", { length: 30 }),
  brand: varchar("brand", { length: 50 }),
  model: varchar("model", { length: 50 }),
  year: integer("year"),
  totalSeats: integer("total_seats").default(70).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Bus = typeof buses.$inferSelect;
export type InsertBus = typeof buses.$inferInsert;

// ─── Stations ───────────────────────────────────────────────────────────────
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).default("Bénin").notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

// ─── Stops ──────────────────────────────────────────────────────────────────
export const stops = pgTable("stops", {
  id: serial("id").primaryKey(),
  lineCode: varchar("line_code", { length: 20 }).notNull(),
  stationId: integer("station_id"),
  stationName: varchar("station_name", { length: 150 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  orderIndex: integer("order_index").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Stop = typeof stops.$inferSelect;
export type InsertStop = typeof stops.$inferInsert;

// ─── Staff ──────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: staffEmployeeRoleEnum("role").default("agent").notNull(),
  station: varchar("station", { length: 100 }),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  hireDate: date("hire_date"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

// ─── Staff Profiles (dashboard users) ───────────────────────────────────────
export const staffProfiles = pgTable("staff_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  employeeId: varchar("employee_id", { length: 20 }),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: staffRoleEnum("role").notNull(),
  stationId: integer("station_id"),
  stationName: varchar("station_name", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type InsertStaffProfile = typeof staffProfiles.$inferInsert;

// ─── Transactions ────────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  description: text("description"),
  reference: varchar("reference", { length: 50 }),
  stationId: integer("station_id"),
  stationName: varchar("station_name", { length: 100 }),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("transactions_created_at_idx").on(t.createdAt),
  index("transactions_type_idx").on(t.type),
]);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─── Charges ────────────────────────────────────────────────────────────────
export const charges = pgTable("charges", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  status: chargeStatusEnum("status").default("pending").notNull(),
  departureRef: varchar("departure_ref", { length: 30 }),
  stationId: integer("station_id"),
  stationName: varchar("station_name", { length: 100 }),
  paidAt: timestamp("paid_at"),
  paidBy: integer("paid_by"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Charge = typeof charges.$inferSelect;
export type InsertCharge = typeof charges.$inferInsert;

// ─── Bookings (online reservations) ────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingRef: varchar("booking_ref", { length: 20 }).notNull().unique(),
  tripId: integer("trip_id"),
  clientId: integer("client_id"),
  passengerName: varchar("passenger_name", { length: 150 }).notNull(),
  passengerPhone: varchar("passenger_phone", { length: 30 }).notNull(),
  passengerEmail: varchar("passenger_email", { length: 320 }),
  seatNumbers: text("seat_numbers"), // JSON array
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("mobile_money"),
  status: bookingStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at"),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Seat Locks ─────────────────────────────────────────────────────────────
export const seatLocks = pgTable("seat_locks", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  seatNumber: varchar("seat_number", { length: 10 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }),
  status: seatLockStatusEnum("status").default("locked").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SeatLock = typeof seatLocks.$inferSelect;

// ─── Route Fares ────────────────────────────────────────────────────────────
export const routeFares = pgTable("route_fares", {
  id: serial("id").primaryKey(),
  lineCode: varchar("line_code", { length: 20 }),
  fromCity: varchar("from_city", { length: 100 }).notNull(),
  toCity: varchar("to_city", { length: 100 }).notNull(),
  priceXof: decimal("price_xof", { precision: 10, scale: 2 }).notNull(),
  priceGhs: decimal("price_ghs", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("route_fares_unique").on(t.fromCity, t.toCity),
]);

export type RouteFare = typeof routeFares.$inferSelect;
export type InsertRouteFare = typeof routeFares.$inferInsert;

// ─── Bus Lines ──────────────────────────────────────────────────────────────
export const busLines = pgTable("bus_lines", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  type: tripTypeEnum("type").default("national").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BusLine = typeof busLines.$inferSelect;
export type InsertBusLine = typeof busLines.$inferInsert;

// ─── Station Cash Registers ──────────────────────────────────────────────────
export const stationCashRegisters = pgTable("station_cash_registers", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id"),
  stationName: varchar("station_name", { length: 100 }).notNull(),
  cashierId: integer("cashier_id"),
  cashierName: varchar("cashier_name", { length: 150 }),
  openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  isOpen: boolean("is_open").default(true).notNull(),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StationCashRegister = typeof stationCashRegisters.$inferSelect;
export type InsertStationCashRegister = typeof stationCashRegisters.$inferInsert;

// ─── Cashier Profiles ───────────────────────────────────────────────────────
export const cashierProfiles = pgTable("cashier_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  pin: varchar("pin", { length: 64 }),
  stationId: integer("station_id"),
  stationName: varchar("station_name", { length: 100 }),
  canSellTickets: boolean("can_sell_tickets").default(true).notNull(),
  canSellShipments: boolean("can_sell_shipments").default(true).notNull(),
  canViewFinance: boolean("can_view_finance").default(false).notNull(),
  canManageDepartures: boolean("can_manage_departures").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CashierProfile = typeof cashierProfiles.$inferSelect;

// ─── Luggage Tickets ─────────────────────────────────────────────────────────
export const luggageTickets = pgTable("luggage_tickets", {
  id: serial("id").primaryKey(),
  luggageRef: varchar("luggage_ref", { length: 20 }).notNull().unique(),
  ticketNumber: varchar("ticket_number", { length: 20 }),
  departureRef: varchar("departure_ref", { length: 30 }),
  passengerName: varchar("passenger_name", { length: 150 }).notNull(),
  passengerPhone: varchar("passenger_phone", { length: 30 }),
  luggageCount: integer("luggage_count").default(1).notNull(),
  totalWeight: decimal("total_weight", { precision: 8, scale: 2 }),
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  status: luggageStatusEnum("status").default("registered").notNull(),
  registeredBy: integer("registered_by"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LuggageTicket = typeof luggageTickets.$inferSelect;
export type InsertLuggageTicket = typeof luggageTickets.$inferInsert;

// ─── Passenger Baggage ───────────────────────────────────────────────────────
export const passengerBaggage = pgTable("passenger_baggage", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }),
  departureRef: varchar("departure_ref", { length: 30 }),
  passengerName: varchar("passenger_name", { length: 150 }).notNull(),
  passengerPhone: varchar("passenger_phone", { length: 30 }),
  seatNumber: varchar("seat_number", { length: 10 }),
  baggageCount: integer("baggage_count").default(0).notNull(),
  totalWeight: decimal("total_weight", { precision: 8, scale: 2 }),
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paidAt: timestamp("paid_at"),
  registeredBy: integer("registered_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PassengerBaggage = typeof passengerBaggage.$inferSelect;
export type InsertPassengerBaggage = typeof passengerBaggage.$inferInsert;

// ─── Client Profiles ─────────────────────────────────────────────────────────
export const clientProfiles = pgTable("client_profiles", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  country: varchar("country", { length: 100 }),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = typeof clientProfiles.$inferInsert;

// ─── Loyalty Points ──────────────────────────────────────────────────────────
export const loyaltyPoints = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  points: integer("points").notNull(),
  reason: varchar("reason", { length: 255 }),
  bookingRef: varchar("booking_ref", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Client Discounts ────────────────────────────────────────────────────────
export const clientDiscounts = pgTable("client_discounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: varchar("user_name", { length: 150 }),
  action: auditActionEnum("action").notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 50 }),
  details: text("details"), // JSON
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("audit_logs_created_at_idx").on(t.createdAt),
  index("audit_logs_user_id_idx").on(t.userId),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Exchange Rates ──────────────────────────────────────────────────────────
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("base_currency", { length: 10 }).notNull(),
  rates: text("rates").notNull(), // JSON
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});
