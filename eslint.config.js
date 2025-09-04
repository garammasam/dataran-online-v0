import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "out/**/*",
      "dist/**/*",
      "build/**/*"
    ]
  }
];

export default eslintConfig;