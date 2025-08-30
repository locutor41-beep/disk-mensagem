// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // garante que os assets e rotas funcionem a partir da raiz do domínio
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets"
  },
  server: {
    port: 5173,
    open: false
  }
});
