import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/database.js";
import "./models/association.js";

import userRoutes from "./routes/users_routes.js";
import pelangganRoutes from "./routes/pelanggan_routes.js";
import btsRoutes from "./routes/bts_routes.js";
import tagihanRoutes from "./routes/tagihan_routes.js";
import pembayaranRoutes from "./routes/pembayaran_routes.js";
import logsRoutes from "./routes/logs_routes.js";
import paketRoutes from "./routes/paket_routes.js";
import dashboardRoutes from "./routes/dashboard_routes.js";
import viewMapsRoutes from "./routes/view_maps_routes.js";
import { Server as SocketIOServer } from "socket.io";
import { computeDashboardSummary } from "./controllers/dashboard_controller.js";
import { generateTagihanForMonth } from "./controllers/tagihan_controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register routes with /api prefix
app.use("/api", userRoutes);
app.use("/api", pelangganRoutes);
app.use("/api", btsRoutes);
app.use("/api", tagihanRoutes);
app.use("/api", pembayaranRoutes);
app.use("/api", logsRoutes);
app.use("/api", paketRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", viewMapsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected to dashboard socket:", socket.id);
});

const startDashboardBroadcast = () => {
  const intervalMs = 10000; // 10 detik
  setInterval(async () => {
    try {
      const summary = await computeDashboardSummary();
      io.emit("dashboard:update", summary);
    } catch (error) {
      console.error("❌ Failed to broadcast dashboard summary:", error);
    }
  }, intervalMs);
};

const startTagihanScheduler = () => {
  const oneDayMs = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month0 = now.getMonth();

      // Selalu pastikan tagihan bulan ini ada (idempotent di controller)
      await generateTagihanForMonth(year, month0);

      // Jika sudah tanggal 28+, generate juga bulan depan
      if (now.getDate() >= 28) {
        const nextMonth0 = (month0 + 1) % 12;
        const nextYear = month0 === 11 ? year + 1 : year;
        await generateTagihanForMonth(nextYear, nextMonth0);
      }
    } catch (error) {
      console.error("❌ Failed to run tagihan scheduler:", error);
    }
  }, oneDayMs);
};

// Test DB connection & sync models, lalu jalankan server
(async () => {
  try {
    await db.authenticate();
    console.log("✅ Database connected...");

    await db.sync({ alter: true }); // gunakan { alter: true } jika masih sering ganti skema tabel
    console.log("✅ Database synchronized...");

    startDashboardBroadcast();
    startTagihanScheduler();

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
})();
