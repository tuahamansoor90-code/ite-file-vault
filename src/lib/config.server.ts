import process from "node:process";
import fs from "node:fs";
import path from "node:path";

let envCached: Record<string, string> | null = null;

export function loadEnvFromFile(): Record<string, string> {
  if (envCached) return envCached;
  const env: Record<string, string> = {};
  const possiblePaths = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), "resources", "app", ".env"),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            env[key] = val;
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }
  envCached = env;
  return env;
}

export function getEnvVar(key: string): string {
  if (process.env[key]) return process.env[key]!;
  loadEnvFromFile();
  return process.env[key] || "";
}

export function getServerConfig() {
  return {
    nodeEnv: getEnvVar("NODE_ENV"),
  };
}
