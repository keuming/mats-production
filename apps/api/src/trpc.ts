import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";
import { verifySessionToken } from "./lib/auth";
import { getDb } from "@mats/db";
import { eq } from "drizzle-orm";
import { users } from "@mats/db";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: typeof users.$inferSelect | null;
};

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<TrpcContext> {
  let user: typeof users.$inferSelect | null = null;
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const payload = await verifySessionToken(token);
      if (payload?.userId) {
        const db = getDb();
        const found = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        user = found[0] ?? null;
      }
    }
  } catch {
    user = null;
  }
  return { req, res, user };
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
