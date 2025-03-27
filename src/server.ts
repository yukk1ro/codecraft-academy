import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { config } from "./config";
import apiRoutes from "./routes/api";
import { WebSocketService } from "./services/websocketService";

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket service
const wsService = WebSocketService.getInstance(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api", apiRoutes);

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Connect to MongoDB
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: config.nodeEnv === "development" ? err.message : undefined,
    });
  }
);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
