import tsparser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  {
    ignores: ["node_modules/", "main.js", "test-vault/"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      obsidianmd: obsidianmd,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-floating-promises": "error",
      ...obsidianmd.configs.recommended,
    },
  },
];
