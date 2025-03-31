import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ?? 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  if (!global.io) {
    global.io = new Server(httpServer);

    global.io.use((socket, next) => {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      const token = cookies.token;

      if (!token) {
        next(new Error("Authentication error"));
        return;
      }
      try {
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        socket.userId = payload.id;
        console.log(` [ws] - ${payload.username} connected`);
        next();
      } catch (e) {
        console.error(e);
        next(new Error("Authentication error"));
      }
    });

    global.io.on("connection", (socket) => {
      socket.join(socket.userId);

      socket.on("disconnect", () => {
        socket.leave(socket.userId);
      });
    });
  }

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
})

