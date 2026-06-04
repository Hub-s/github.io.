import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { Server as SocketIOServer } from "socket.io";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { stripeWebhookRouter } from "../stripe/webhook";

// Declare global io type at module level
declare global {
  var io: SocketIOServer | undefined;
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Store active socket connections for broadcasting
export const activeConnections = new Map<number, Set<string>>();

// Function to broadcast notification to user
export function broadcastNotificationToUser(userId: number, notification: any) {
  const userSockets = activeConnections.get(userId);
  if (userSockets && io) {
    userSockets.forEach(socketId => {
      io?.to(socketId).emit('notification', notification);
    });
  }
}

let io: SocketIOServer | null = null;

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize Socket.io
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  
  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (userId: number) => {
      if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
      }
      activeConnections.get(userId)!.add(socket.id);
      socket.data.userId = userId;
      console.log(`[WebSocket] User ${userId} authenticated with socket ${socket.id}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        const userSockets = activeConnections.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            activeConnections.delete(userId);
          }
        }
      }
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    // Handle test event
    socket.on('test', (data) => {
      console.log(`[WebSocket] Test event from ${socket.id}:`, data);
      socket.emit('test-response', { message: 'Test successful', timestamp: new Date() });
    });
  });

  // Stripe webhook MUST be registered BEFORE body parser for signature verification
  app.use("/api/stripe", stripeWebhookRouter);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Make io available globally
  (global as any).io = io;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[WebSocket] Server listening on http://localhost:${port}`);
  });
}

startServer().catch(console.error);
