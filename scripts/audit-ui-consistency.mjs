import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const allowedExtensions = new Set([".css", ".ts", ".tsx"]);
const excludedSegments = [
  `${join("components", "admin")}`,
  `${join("components", "chat")}`,
  `${join("app", "[locale]", "(main)", "ai")}`,
];

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return allowedExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

const rules = [
  {
    name: "negative letter spacing",
    pattern: /letter-spacing:\s*-|tracking-\[-/,
  },
  {
    name: "retired purple palette",
    pattern: /brand-purple|#7b2cbf|#f5f1fc|#e7def5/i,
  },
  {
    name: "raw page horizontal padding",
    pattern: /\bpx-5\b/,
  },
];

const violations = [];

for (const file of collectFiles(sourceRoot)) {
  const relativePath = relative(sourceRoot, file);
  if (
    relativePath.includes(".stories.") ||
    excludedSegments.some((segment) => relativePath.startsWith(segment))
  ) {
    continue;
  }

  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        violations.push(`${relativePath}:${index + 1} ${rule.name}`);
      }
    }

    const chevronSize = line.match(/<ChevronRight[^>]*size=\{(\d+)\}/);
    const allowsLargeChevron =
      relativePath.endsWith(join("RewardCalendar", "RewardCalendar.tsx")) ||
      relativePath.endsWith("HomeBannerCarousel.tsx");
    if (chevronSize && chevronSize[1] !== "18" && !allowsLargeChevron) {
      violations.push(`${relativePath}:${index + 1} card chevron must be 18px`);
    }
  });
}

if (violations.length > 0) {
  console.error("UI consistency audit failed:\n");
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exit(1);
}

console.log("UI consistency audit passed.");
