import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/mundialis": {
        target: "https://ows.mundialis.de",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mundialis/, ""),
      },
    },
  },
});
