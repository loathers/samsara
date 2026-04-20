// @ts-check
import eslint from "@eslint/js";
import react from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat["jsx-runtime"],
  {
    ignores: ["build", ".react-router"],
  },
);
