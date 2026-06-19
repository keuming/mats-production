import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, createTRPCClient } from "@trpc/client";
import superjson from "superjson";
import type { AnyTRPCRouter } from "@trpc/server";

// Note: using a loose AnyTRPCRouter type instead of importing the concrete
// AppRouter type from the API package. Importing the API's router.ts directly
// pulls Express/Drizzle/server-only code into the frontend's type-check pass,
// which breaks `tsc` in this Vercel monorepo setup. Runtime behavior (calls,
// inputs, outputs) is unaffected — only compile-time autocomplete is reduced.
type AppRouter = AnyTRPCRouter;

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.matstransport.com";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("mats_client_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        transformer: superjson,
        headers: getAuthHeaders,
      }),
    ],
  });
}

export const apiClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      transformer: superjson,
      headers: getAuthHeaders,
    }),
  ],
});
