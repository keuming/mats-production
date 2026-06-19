import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "../../packages/shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-hook-form"],
          "vendor-routing": ["wouter", "@tanstack/react-query"],
          "vendor-trpc": ["@trpc/client", "@trpc/react-query", "superjson"],
          "vendor-ui": ["framer-motion", "lucide-react"],
        },
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});
