import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import nodeenv from "node:process";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3005,
      host: "0.0.0.0",
      strictPort: false,
      allowedHosts: true,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      // Ensure proper bundling instead of relying on CDNs
      modulePreload: {
        polyfill: true,
      },
    },
    plugins: [
      react({
        // Ensure proper JSX transformation
        jsxRuntime: "automatic",
        jsxImportSource: "react",
      }),
    ],
    define: {
      process: {
        env: { ...nodeenv.env },
        cwd: () => process.cwd(),
        NODE_ENV: mode,
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env": JSON.stringify(env),
        "process.env.VITE_GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      },
      "process.env.API_KEY": JSON.stringify(
        env.API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY,
      ),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    // Add optimization for production
    optimizeDeps: {
      include: ["react", "react-dom", "@google/genai", "lucide-react"],
    },
  };
});
