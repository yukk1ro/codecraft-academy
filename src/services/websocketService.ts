import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { auth } from "../middleware/auth";
import { config } from "../config";

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server;
  private userSockets: Map<string, Socket[]>;
  private challengeRooms: Map<string, Set<string>>;

  private constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin:
          config.nodeEnv === "production" ? "https://your-domain.com" : "*",
        methods: ["GET", "POST"],
      },
    });

    this.userSockets = new Map();
    this.challengeRooms = new Map();

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  public static getInstance(server: HttpServer): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = await auth.verifyToken(token);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      const userId = socket.data.userId;
      this.handleUserConnection(userId, socket);

      // Join challenge room
      socket.on("joinChallenge", (challengeId: string) => {
        this.handleJoinChallenge(socket, challengeId);
      });

      // Leave challenge room
      socket.on("leaveChallenge", (challengeId: string) => {
        this.handleLeaveChallenge(socket, challengeId);
      });

      // Handle code updates
      socket.on("codeUpdate", (data: { challengeId: string; code: string }) => {
        this.handleCodeUpdate(socket, data);
      });

      // Handle cursor position
      socket.on(
        "cursorMove",
        (data: { challengeId: string; position: any }) => {
          this.handleCursorMove(socket, data);
        }
      );

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleUserDisconnection(userId, socket);
      });
    });
  }

  private handleUserConnection(userId: string, socket: Socket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)?.push(socket);
  }

  private handleUserDisconnection(userId: string, socket: Socket) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      const index = userSockets.indexOf(socket);
      if (index > -1) {
        userSockets.splice(index, 1);
      }
      if (userSockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  private handleJoinChallenge(socket: Socket, challengeId: string) {
    socket.join(challengeId);
    if (!this.challengeRooms.has(challengeId)) {
      this.challengeRooms.set(challengeId, new Set());
    }
    this.challengeRooms.get(challengeId)?.add(socket.data.userId);
  }

  private handleLeaveChallenge(socket: Socket, challengeId: string) {
    socket.leave(challengeId);
    const room = this.challengeRooms.get(challengeId);
    if (room) {
      room.delete(socket.data.userId);
      if (room.size === 0) {
        this.challengeRooms.delete(challengeId);
      }
    }
  }

  private handleCodeUpdate(
    socket: Socket,
    data: { challengeId: string; code: string }
  ) {
    socket.to(data.challengeId).emit("codeUpdate", {
      userId: socket.data.userId,
      code: data.code,
    });
  }

  private handleCursorMove(
    socket: Socket,
    data: { challengeId: string; position: any }
  ) {
    socket.to(data.challengeId).emit("cursorMove", {
      userId: socket.data.userId,
      position: data.position,
    });
  }

  // Public methods for external use
  public broadcastToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach((socket) => {
        socket.emit(event, data);
      });
    }
  }

  public broadcastToChallenge(challengeId: string, event: string, data: any) {
    this.io.to(challengeId).emit(event, data);
  }

  public getConnectedUsers(challengeId: string): string[] {
    return Array.from(this.challengeRooms.get(challengeId) || []);
  }
}
