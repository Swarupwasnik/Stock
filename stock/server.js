import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { Server } from "socket.io";
import { createServer } from "http";
import authRoutes from "./routes/authRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import { getStockPrice } from "./services/stockService.js";
import { sendAlertEmail } from "./services/emailService.js";
import Alert from "./models/Alert.js";
import "./config/passport.js";
import cors from "cors";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 30000,
  pingTimeout: 5000,
});

app.use(passport.initialize());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
await connectDB();

app.use("/api/auth", authRoutes);
app.use(
  "/api/watchlist",
  passport.authenticate("jwt", { session: false }),
  watchlistRoutes
);
app.use(
  "/api/alerts",
  passport.authenticate("jwt", { session: false }),
  alertRoutes
);

const apiCallTimestamps = [];
const MAX_API_CALLS_PER_MINUTE = 5;
const ONE_MINUTE = 60000;

const checkRateLimit = () => {
  const now = Date.now();
  const oneMinuteAgo = now - ONE_MINUTE;

  while (apiCallTimestamps.length > 0 && apiCallTimestamps[0] < oneMinuteAgo) {
    apiCallTimestamps.shift();
  }

  if (apiCallTimestamps.length >= MAX_API_CALLS_PER_MINUTE) {
    const timeToWait = ONE_MINUTE - (now - apiCallTimestamps[0]);
    return timeToWait;
  }

  apiCallTimestamps.push(now);
  return 0;
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  const intervals = {
    heartbeat: null,
    update: null,
  };

  socket.on("ping", (cb) => {
    if (typeof cb === "function") cb();
  });

  intervals.heartbeat = setInterval(() => {
    try {
      socket.emit("ping");
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  }, 25000);

  socket.on("watchlist", async (stocks) => {
    try {
      if (!Array.isArray(stocks)) {
        console.error("Invalid stocks data received");
        socket.emit("error", { message: "Invalid stocks data format" });
        return;
      }

      if (intervals.update) {
        clearInterval(intervals.update);
      }

      const initialUpdates = [];
      for (const symbol of stocks) {
        const timeToWait = checkRateLimit();
        if (timeToWait > 0) {
          console.log(`Rate limit reached. Waiting for ${timeToWait} ms.`);
          await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }

        try {
          const price = await getStockPrice(symbol);
          initialUpdates.push({ symbol, price });
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error.message);
          initialUpdates.push({ symbol, price: null, error: error.message });
        }
      }
      socket.emit("priceUpdate", initialUpdates);

      intervals.update = setInterval(async () => {
        const updates = [];
        for (const symbol of stocks) {
          const timeToWait = checkRateLimit();
          if (timeToWait > 0) {
            await new Promise((resolve) => setTimeout(resolve, timeToWait));
          }

          try {
            const price = await getStockPrice(symbol);
            updates.push({ symbol, price });
          } catch (error) {
            console.error(
              `Failed to fetch price for ${symbol}:`,
              error.message
            );
            updates.push({ symbol, price: null, error: error.message });
          }
        }
        socket.emit("priceUpdate", updates);
      }, 15000);
    } catch (error) {
      console.error("WebSocket watchlist error:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected (${socket.id}):`, reason);
    if (intervals.heartbeat) clearInterval(intervals.heartbeat);
    if (intervals.update) clearInterval(intervals.update);
  });
});

const alertInterval = setInterval(async () => {
  try {
    const alerts = await Alert.find({ triggered: false }).populate("user");
    for (const alert of alerts) {
      const timeToWait = checkRateLimit();
      if (timeToWait > 0) {
        console.log(`Rate limit reached. Waiting for ${timeToWait} ms.`);
        await new Promise((resolve) => setTimeout(resolve, timeToWait));
      }

      try {
        const currentPrice = await getStockPrice(alert.symbol);
        if (
          (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
          (alert.condition === "below" && currentPrice <= alert.targetPrice)
        ) {
          await sendAlertEmail(alert.user.email, alert.symbol, currentPrice);
          alert.triggered = true;
          await alert.save();
          console.log(`Alert triggered for ${alert.symbol} at ${currentPrice}`);
        }
      } catch (error) {
        console.error(`Failed to process alert for ${alert.symbol}:`, error);
      }
    }
  } catch (error) {
    console.error("Alert interval error:", error);
  }
}, 30000);

const shutdown = async () => {
  console.log("Shutting down server...");
  clearInterval(alertInterval);

  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
