import {
  Contract,
  JsonRpcProvider,
  FallbackProvider,
  Wallet,
  parseUnits,
} from "ethers";
import mongoose from "mongoose";
import dotenv from "dotenv";

import UserModel from "../models/user.model.js";
import Withdrawal from "../models/withdrwal.model.js";

dotenv.config();

// ============================================
// PROVIDER SETUP
// ============================================
const RPC_URLS = [
  process.env.ETH_RPC_URL,
  "https://ethereum-rpc.publicnode.com",
].filter(Boolean);

console.log(`✅ Configured ${RPC_URLS.length} RPC endpoint(s)`);

const providerList = RPC_URLS.map((url, i) => ({
  provider: new JsonRpcProvider(url),
  priority: i + 1,
  stallTimeout: 2000,
  weight: 1,
}));

const provider =
  providerList.length > 1
    ? new FallbackProvider(providerList, 1)
    : providerList[0].provider;

// ============================================
// ADMIN WALLET & CONTRACT
// ============================================
if (!process.env.PRIVATE_KEY) {
  throw new Error("❌ PRIVATE_KEY missing in .env");
}
if (!process.env.LLD_CONTRACT_ADDRESS) {
  throw new Error("❌ LLD_CONTRACT_ADDRESS missing in .env");
}

const adminWallet = new Wallet(process.env.PRIVATE_KEY, provider);

const lldAddress = process.env.LLD_CONTRACT_ADDRESS;
const LLD_DECIMALS = Number(process.env.LLD_DECIMALS || 18);

const lldABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const lldContract = new Contract(lldAddress, lldABI, adminWallet);

// ============================================
// RETRY HELPER
// ============================================
const retryRpcCall = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable =
        err.code === "CALL_EXCEPTION" ||
        err.code === "NETWORK_ERROR" ||
        err.code === "TIMEOUT" ||
        err.code === "SERVER_ERROR" ||
        err.info?.error?.message?.includes("header not found") ||
        err.info?.error?.message?.includes("unreachable");

      if (!isRetryable || i === maxRetries - 1) throw err;

      console.warn(
        `RPC call failed (attempt ${i + 1}/${maxRetries}), retrying in ${delayMs * (i + 1)}ms...`,
      );
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
};

// ============================================
// WITHDRAWAL CONTROLLER
// ============================================
export const processWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  const startTime = Date.now();

  try {
    const userId = req.user._id;
    const { amount } = req.body;

    console.log(
      `\n[WITHDRAWAL] 🚀 Started for user: ${userId}, amount: ${amount}`,
    );

    // 1. Validation
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0 || isNaN(numAmount)) {
      return res.status(400).json({
        success: false,
        message: "Oops! Please enter a valid amount to continue.",
      });
    }

    // 2. User fetch
    console.log(`[WITHDRAWAL] 📥 Fetching user...`);
    const user = await UserModel.findById(userId).select(
      "walletAddress currentEarnings totalPayouts",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find your account. Please log in again.",
      });
    }

    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Your wallet address isn't set up yet. Please add it first.",
      });
    }

    // 3. Full amount in wei (no fee deduction)
    const amountInWei = parseUnits(numAmount.toString(), LLD_DECIMALS);

    console.log(`[WITHDRAWAL] 💰 Full amount to send: ${numAmount} LLD`);

    // 4. Admin balance check
    console.log(`[WITHDRAWAL] 🔍 Checking admin LLD balance...`);
    let adminBalance;
    try {
      adminBalance = await retryRpcCall(() =>
        lldContract.balanceOf(adminWallet.address),
      );
      console.log(
        `[WITHDRAWAL] ✅ Admin balance: ${adminBalance.toString()} wei`,
      );
    } catch (rpcErr) {
      console.error("[WITHDRAWAL] ❌ RPC FAILURE:", rpcErr.message);
      return res.status(503).json({
        success: false,
        message:
          "Blockchain network is temporarily unavailable. Please try again in a minute.",
      });
    }

    if (adminBalance < amountInWei) {
      console.warn(`[WITHDRAWAL] ⚠️ Admin wallet has insufficient LLD`);
      return res.status(503).json({
        success: false,
        message:
          "Our service is a bit busy right now. Please try again in a few minutes.",
      });
    }

    // 5. Atomic DB deduction
    console.log(`[WITHDRAWAL] 🔒 Deducting balance atomically...`);
    session.startTransaction();

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId, currentEarnings: { $gte: numAmount } },
      {
        $inc: {
          currentEarnings: -numAmount,
          totalPayouts: numAmount,
        },
      },
      { new: true, session },
    );

    if (!updatedUser) {
      await session.abortTransaction();
      console.warn(`[WITHDRAWAL] ⚠️ Insufficient balance in DB`);
      return res.status(400).json({
        success: false,
        message:
          "You don't have enough balance for this withdrawal. Please check and try again.",
      });
    }

    await session.commitTransaction();
    console.log(
      `[WITHDRAWAL] ✅ Balance deducted. New balance: ${updatedUser.currentEarnings}`,
    );

    // 6. Blockchain transfer
    console.log(`[WITHDRAWAL] ⛓️  Broadcasting transaction to Ethereum...`);
    let txHash = null;
    try {
      const tx = await retryRpcCall(() =>
        lldContract.transfer(user.walletAddress, amountInWei),
      );
      txHash = tx.hash;
      console.log(`[WITHDRAWAL] 📡 TX broadcasted: ${txHash}`);
      console.log(`[WITHDRAWAL] ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait(1);
      if (receipt.status !== 1) {
        throw new Error("Transaction was reverted on-chain");
      }
      console.log(
        `[WITHDRAWAL] ✅ TX confirmed in block ${receipt.blockNumber}`,
      );
    } catch (txErr) {
      console.error(`[WITHDRAWAL] ❌ TX failed:`, txErr.message);

      // Rollback DB
      session.startTransaction();
      try {
        await UserModel.findByIdAndUpdate(
          userId,
          {
            $inc: {
              currentEarnings: numAmount,
              totalPayouts: -numAmount,
            },
          },
          { session },
        );

        await Withdrawal.create(
          [
            {
              userId,
              userWalletAddress: user.walletAddress,
              amount: numAmount,
              token: "LLD",
              network: "ethereum",
              transactionHash: txHash || "",
              status: "failed",
              error: txErr.message,
            },
          ],
          { session },
        );

        await session.commitTransaction();
        console.log(`[WITHDRAWAL] 🔄 DB rolled back successfully`);
      } catch (rollbackErr) {
        await session.abortTransaction();
        console.error("[CRITICAL] Rollback failed:", rollbackErr);
      }

      return res.status(500).json({
        success: false,
        message:
          "Your transaction couldn't go through, but your balance is safe. Please try again later.",
        error: txErr.message,
      });
    }

    // 7. Save successful record
    console.log(`[WITHDRAWAL] 💾 Saving success record...`);
    session.startTransaction();
    await Withdrawal.create(
      [
        {
          userId,
          userWalletAddress: user.walletAddress,
          amount: numAmount,
          token: "LLD",
          network: "ethereum",
          transactionHash: txHash,
          status: "completed",
          approvedDate: new Date(),
        },
      ],
      { session },
    );
    await session.commitTransaction();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[WITHDRAWAL] 🎉 COMPLETED in ${totalTime}s | TX: ${txHash}\n`);

    return res.status(200).json({
      success: true,
      message: `Withdrawal successful! ${numAmount.toFixed(4)} LLD is on its way to your wallet.`,
      data: {
        txHash,
        amount: numAmount,
        token: "LLD",
        network: "ethereum",
      },
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("[WITHDRAWAL] ❌ FATAL:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong on our end. Please try again shortly.",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};
