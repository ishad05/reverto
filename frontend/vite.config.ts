import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../reverto/public/frontend",
    emptyOutDir: true,
  },
  server: {
    host: "reverto.localhost",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://reverto.localhost:8000",
        changeOrigin: true,
      },
      "/assets": {
        target: "http://reverto.localhost:8000",
        changeOrigin: true,
      },
      "/files": {
        target: "http://reverto.localhost:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
