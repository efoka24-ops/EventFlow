import { execSync } from "node:child_process";
import { app } from "./app.js";
import { config } from "./config.js";

const freePort = (port) => {
  try {
    // Windows: find and kill process occupying the port
    const result = execSync(
      `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTEN"') do taskkill /F /PID %a`,
      { shell: "cmd.exe", stdio: "pipe" }
    );
    console.warn(`[server] Freed port ${port}`);
  } catch {
    // Port already free or taskkill failed — proceed
  }
};

let activeServer = null;

const startServer = () => {
  const server = app.listen(config.port, () => {
    console.log(`EventFlow backend running on http://localhost:${config.port}`);
  });
  activeServer = server;

  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.warn(`[server] Port ${config.port} busy — killing occupant and retrying in 1.5s...`);
      freePort(config.port);
      setTimeout(startServer, 1500);
      return;
    }
    throw err;
  });
};

startServer();

const shutdown = () => {
  if (!activeServer) return process.exit(0);
  activeServer.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
