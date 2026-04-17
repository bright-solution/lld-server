import { ethers } from "ethers";
import dotenv from "dotenv";
import InvestmentABI from "../config/abi.js";

dotenv.config();

// =========================
// RPC PROVIDER
// =========================
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC);

// =========================
// WALLET
// =========================
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// =========================
// CONTRACT INSTANCE
// =========================
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  InvestmentABI,
  wallet,
);

export default contract;
