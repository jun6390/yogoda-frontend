// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginQuery from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // TanStack Query 사용 시 발생하기 쉬운 캐시/의존성 관련 실수 검사함
  ...pluginQuery.configs["flat/recommended"],

  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    "test-results/**",
    "playwright-report/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "next-env.d.ts",
  ]),

  ...storybook.configs["flat/recommended"],

  // Prettier와 충돌하는 ESLint 스타일 규칙을 비활성화함
  eslintConfigPrettier,
]);

export default eslintConfig;
