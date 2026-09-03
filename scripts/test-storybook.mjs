import { spawnSync } from "node:child_process";

for (const theme of ["light", "dark"]) {
  for (const locale of ["ko", "en"]) {
    console.log(`Storybook accessibility: ${theme}/${locale}`);
    const result = spawnSync(
      process.execPath,
      ["node_modules/vitest/vitest.mjs", "run", "--project", "storybook"],
      {
        env: {
          ...process.env,
          VITE_STORYBOOK_THEME: theme,
          VITE_STORYBOOK_LOCALE: locale,
        },
        stdio: "inherit",
        timeout: 180000,
      },
    );
    if (result.error) console.error(result.error.message);
    if (result.status !== 0) process.exitCode = 1;
  }
}
