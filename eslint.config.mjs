import tsparser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import obsidianmd from "eslint-plugin-obsidianmd";

const obsidianRecommendedRules = Object.assign(
  {},
  ...obsidianmd.configs.recommended.map((config) =>
    Object.fromEntries(
      Object.entries(config.rules ?? {}).filter(([ruleName]) =>
        ruleName.startsWith("obsidianmd/"),
      ),
    ),
  ),
);

export default [
  {
    ignores: ["node_modules/", "main.js", "eslint.config.mjs", "test-vault/"],
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
      ...obsidianRecommendedRules,
    },
  },
];
