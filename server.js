import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import expressSession from "express-session";
import path, { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import connectToDB from "./DB/DB.js";
import UserRouter from "./routes/user.router.js";
import AdminRouter from "./routes/admin.routes.js";
import lldRouter from "./routes/Lldtransaction.route .js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

app.use("/uploads", express.static(join(__dirname, "uploads")));

const allowedOrigins = [
  "https://tokenbridge.online",
  "https://www.tokenbridge.online",
  "http://localhost:5173",
  "http://192.168.1.15:5173",
  "http://192.168.1.24:5173",
  "http://192.168.1.13:5173",
];

// ✅ CORS middleware (important)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use(morgan("dev"));

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

app.use("/api/users", UserRouter);
app.use("/api/admin", AdminRouter);

connectToDB()
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    import("./utils/cronJobs.js");

    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  });
