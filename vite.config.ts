import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "node:path";
import nodeenv from "node:process";
import { defineConfig, loadEnv } from "vite";
const __dirname = nodeenv.cwd();
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Determine base path for different deployment targets
  const isGitHubPages = env.GITHUB_ACTIONS === "true";
  const isElectronBuild =
    env.ELECTRON === "true" || process.env.ELECTRON === "true";
  const repoName = env.GITHUB_REPOSITORY || "pixelforge-ai-studio";
  const repoParts = repoName.split("/");

  let basePath = "/";
  if (isGitHubPages && repoParts.length > 1) {
    basePath = `/${repoParts[1]}/`;
  } else if (isElectronBuild || mode === "production") {
    // Use relative paths for Electron builds or production to work with loadFile()
    basePath = "./";
  }

  return {
    base: basePath,
    server: {
      port: 3005,
      host: "0.0.0.0",
      strictPort: false,
      allowedHosts: true,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: mode === "development",
      assetsDir: `${__dirname}/assets`,
      minify: mode === "production" ? "esbuild" : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            gemini: ["@google/genai"],
          },
          preloadFileName: "dist/electron/preload.js",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      target: "ES2022",
      reportCompressedSize: false,
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
      "process.env.GITHUB_REPOSITORY": JSON.stringify(repoName),
      "process.env.GITHUB_ACTIONS": JSON.stringify(
        env.GITHUB_ACTIONS || "false",
      ),
      secure: false,
      cache: true,
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
