import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import path from "path";
import { fileURLToPath } from "url";
import module from "module";
const require = module.createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const dir = path.join(__dirname);

process.env.NODE_ENV = "production";
process.chdir(__dirname);

const currentPort = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const configPath = path.join(__dirname, ".next/required-server-files.json");
const nextConfig = require(configPath)?.config;

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const app = next({
  dir,
  dev: false,
  hostname,
  port: currentPort,
  conf: nextConfig,
});

const handler = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer(handler);
    
    if (!global.io) {
      global.io = new Server(httpServer);

      global.io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
        const token = cookies.token;
  
        if (!token) {
          return next(new Error("Authentication error"));
        }
  
        try {
          const payload = jwt.verify(token, process.env.SECRET_KEY);
          socket.userId = payload.id;
          console.log(` [ws] - ${payload.username} connected`);
          next();
        } catch (err) {
          console.error(err);
          next(new Error("Authentication error"));
        }
      });
  
      global.io.on("connection", (socket) => {
        socket.join(socket.userId);
        console.log(`User ${socket.userId} connected`);
  
        socket.on("disconnect", () => {
          socket.leave(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        });
      });
    }


    httpServer.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    httpServer.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
    });
  })
  .catch((err) => {
    console.error("Next.js initialization error:", err);
    process.exit(1);
  });
