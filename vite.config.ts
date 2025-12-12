import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import nodeenv from "process";
import process from "process";
import { defineConfig, loadEnv } from "vite";

const __dirname = nodeenv.cwd();
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // Force cache clear timestamp: 2025-12-11T19:35:51+01:00

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
      target: "ES2022",
      reportCompressedSize: true, // Enable bundle size reporting
      chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB

      // Enhanced code splitting for better caching (disabled for Electron)
      rollupOptions: isElectronBuild
        ? {
            // For Electron: NO chunk splitting to prevent loading order issues
            output: {
              // No manualChunks = everything in one bundle
              chunkFileNames: "assets/[name]-[hash].js",
              entryFileNames: "assets/[name]-[hash].js",
              assetFileNames: "assets/[name]-[hash].[ext]",
            },
          }
        : {
            output: {
              // Strategic chunk splitting for web builds
              manualChunks: id => {
                // Vendor chunks
                if (id.includes("node_modules")) {
                  if (id.includes("@google/genai")) return "ai-vendor";
                  if (id.includes("react") || id.includes("react-dom"))
                    return "react-vendor";
                  if (id.includes("lucide-react")) return "icons-vendor";
                  if (id.includes("rc-dock")) return "ui-vendor";
                  if (id.includes("react-toastify")) return "toast-vendor";
                  return "vendor"; // Other vendor libraries
                }

                // Feature-based chunks
                if (id.includes("services/") || id.includes("utils/"))
                  return "core";
                if (id.includes("components/EditorCanvas")) return "canvas";
                if (
                  id.includes("components/") &&
                  (id.includes("Panel") || id.includes("Modal"))
                )
                  return "ui-components";
                if (id.includes("systems/")) return "systems";
              },

              // Optimized file naming
              chunkFileNames: "assets/[name]-[hash].js",
              entryFileNames: "assets/[name]-[hash].js",
              assetFileNames: "assets/[name]-[hash].[ext]",
            },

            // Tree shaking optimizations - preserve React side effects
            treeshake: {
              moduleSideEffects: id => {
                if (id.includes("react") || id.includes("react-dom")) {
                  return true;
                }
                if (id.includes("rc-dock")) {
                  return true;
                }
                return false;
              },
              propertyReadSideEffects: false,
              tryCatchDeoptimization: false,
            },
          },

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

    // Enhanced dependency optimization
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "lucide-react",
        "@google/genai",
        "rc-dock",
        "react-toastify",
      ],
      exclude: [
        // Exclude heavy dev dependencies
        "@types/node",
        "@playwright/test",
        "eslint",
        "typescript",
        "sharp", // Only used in build scripts
      ],

      // Pre-bundle large dependencies
      esbuildOptions: {
        target: "es2020",
        legalComments: "none",
        minify: true,
        treeShaking: true,
      },
    },

    // Performance monitoring in development
    esbuild: {
      logOverride: { "this-is-undefined-in-esm": "silent" },
      drop: mode === "production" ? ["console", "debugger"] : [],
    },

    // Build performance monitoring
    preview: {
      port: 4173,
      host: "0.0.0.0",
    },
  };
});
