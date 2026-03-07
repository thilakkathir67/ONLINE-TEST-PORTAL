const { rmSync } = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const flags = new Set(process.argv.slice(2));

const projectRoot = process.cwd();
let nextBin;
try {
  nextBin = require.resolve("next/dist/bin/next", { paths: [projectRoot] });
} catch {
  console.error("Cannot resolve Next.js binary. Run `npm install` at repo root.");
  process.exit(1);
}

function cleanCaches() {
  rmSync(path.join(projectRoot, ".next"), { recursive: true, force: true });
  rmSync(path.join(projectRoot, "node_modules", ".cache", "next"), {
    recursive: true,
    force: true,
  });
}

async function prewarm(baseUrl) {
  const routes = ["/", "/login", "/join", "/create", "/dashboard"];
  for (const route of routes) {
    try {
      await fetch(`${baseUrl}${route}`);
      console.log(`[prewarm] ${route}`);
    } catch {
      // Ignore transient dev boot errors.
    }
  }
}

async function waitForServer(baseUrl, timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await fetch(baseUrl);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }
  return false;
}

async function main() {
  if (process.env.CLEAN_NEXT_CACHE === "1" || flags.has("--clean")) {
    cleanCaches();
  }

  const args = [nextBin, "dev"];
  if (process.env.NEXT_DEV_TURBO === "1" || flags.has("--turbo")) {
    args.push("--turbo");
  }

  const devServer = spawn(process.execPath, args, {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
  });

  const port = process.env.PORT || "3000";
  const baseUrl = `http://localhost:${port}`;

  if (process.env.PREWARM_ROUTES === "1" || flags.has("--prewarm")) {
    const ready = await waitForServer(baseUrl);
    if (ready) {
      prewarm(baseUrl).catch(() => {});
    } else {
      console.warn("[prewarm] Server did not become ready in time.");
    }
  }

  devServer.on("exit", (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
