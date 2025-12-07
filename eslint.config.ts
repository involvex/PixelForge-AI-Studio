import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import css from "@eslint/css";

import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: ["dist/**", "node_modules/**", "build/**", ".next/**", ".git/**"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    ignores: ["dist/**", "node_modules/**", "build/**", ".next/**", ".git/**"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [tseslint.configs.recommended],
    rules: {
      "no-unused-expressions": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: ["dist/**", "node_modules/**", "build/**", ".next/**", ".git/**"],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
