import express from "express";
import {
  saveLldBuy,
  getUserTransactions,
  getReferralStats,
  getOverallStats,
} from "../controllers/Lldtransaction.controller.js";
const router = express.Router();

// Agar tumhare paas auth middleware hai toh yahan lagao
// const { protect } = require("../middleware/auth");
// const { adminOnly } = require("../middleware/admin");

// ── Public / Auth routes ───────────────────────────────────────

// Transaction save karo (frontend call karta hai tx success pe)
router.post("/", saveLldBuy);

// Kisi wallet ka history
router.get("/user/:walletAddress", getUserTransactions);

// Kisi wallet ke referral stats
router.get("/referral/:walletAddress", getReferralStats);

// ── Admin only ─────────────────────────────────────────────────
router.get("/stats", getOverallStats); // adminOnly middleware laga sakte ho

export default router;
// ─────────────────────────────────────────────────────────────────
// app.js / server.js me ye add karo:
//
// const lldTxRoutes = require("./routes/lldTransaction.route");
// app.use("/api/transactions/lld-buy", lldTxRoutes);
// ─────────────────────────────────────────────────────────────────
