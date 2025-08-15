import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/bifrost": {
        target: "https://bifrost.dev.afweather.mil",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bifrost/, ""),
      },
      "/kart": {
        target: "http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kart/, ""),
      },
      "/nationalmap": {
        target: "http://basemap.nationalmap.gov/arcgis/rest/services",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nationalmap/, ""),
      },
      "/nasa": {
        target: "https://gibs.earthdata.nasa.gov/wmts",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nasa/, ""),
      },
    },
  },
});
