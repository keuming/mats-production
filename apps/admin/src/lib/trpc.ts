import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AnyTRPCRouter } from "@trpc/server";

// See apps/web/src/lib/trpc.ts for why we don't import the concrete
// AppRouter type from the API package directly.
type AppRouter = AnyTRPCRouter;

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.matstransport.com";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("mats_admin_token");
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

// Standalone client (non-React)
export const apiClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      transformer: superjson,
      headers: getAuthHeaders,
    }),
  ],
});
