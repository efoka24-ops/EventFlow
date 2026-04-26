import { app } from "./app.js";
import { config } from "./config.js";

let activeServer = null;

const startServer = () => {
  const server = app.listen(config.port, () => {
    console.log(`EventFlow backend running on http://localhost:${config.port}`);
  });
  activeServer = server;

  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`[server] Port ${config.port} is already in use. Stop the existing backend process before starting a new one.`);
      process.exit(1);
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

const restartForNodemon = () => {
  if (!activeServer) return process.kill(process.pid, "SIGUSR2");
  activeServer.close(() => process.kill(process.pid, "SIGUSR2"));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.once("SIGUSR2", restartForNodemon);
