import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.css"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "release/**",
      "tailwind.css",
    ],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      "css/no-important": "off",
    },
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "release/**",
      ".next/**",
      ".git/**",
    ],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "release/**",
      ".next/**",
      ".git/**",
    ],
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [tseslint.configs.recommended],
    rules: {
      "no-unused-expressions": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "release/**",
      ".next/**",
      ".git/**",
    ],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
