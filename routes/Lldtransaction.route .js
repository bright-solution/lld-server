import express from "express";
import {
  saveLldBuy,
  getUserTransactions,
  getReferralStats,
  getOverallStats,
} from "../controllers/Lldtransaction.controller.js";
const router = express.Router();
router.post("/", saveLldBuy);
router.get("/user/:walletAddress", getUserTransactions);
router.get("/referral/:walletAddress", getReferralStats);
router.get("/stats", getOverallStats);
export default router;
