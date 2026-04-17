import Investment from "../models/investment.model.js";
import LevelIncome from "../models/LevelIncome.model.js";
import UserModel from "../models/user.model.js";
import Level from "../models/level.model.js";
import contract from "../web3/contract.js";
import { ethers } from "ethers";

// =========================
// CONFIG
// =========================
const DECIMALS = 18;

// =========================
// ONCHAIN FUNCTION
// =========================
const creditLevelIncomeOnChain = async (wallet, amount) => {
  try {
    const tx = await contract.creditIncome(
      wallet,
      ethers.parseUnits(amount.toString(), DECIMALS),
      2, // LEVEL INCOME
    );

    await tx.wait();
    return true;
  } catch (err) {
    console.error("❌ Onchain error:", err.message);
    return false;
  }
};

// =========================
// MAIN FUNCTION (OPTIMIZED)
// =========================
export const distributeLevelIncomeOnRoi = async (
  user,
  roiAmount,
  investmentId,
) => {
  try {
    if (!user?._id || roiAmount <= 0) return;

    // =========================
    // LOAD DATA ONCE (OPTIMIZED)
    // =========================
    const [levels, fromUser, investment] = await Promise.all([
      Level.find({}).sort({ level: 1 }).lean(),
      UserModel.findById(user._id).select("username sponserId"),
      Investment.findById(investmentId),
    ]);

    if (!levels.length || !fromUser?.sponserId || !investment) return;

    let sponsorId = fromUser.sponserId;
    let levelIndex = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // =========================
    // LOOP (SAFE + CONTROLLED)
    // =========================
    while (sponsorId && levelIndex < levels.length) {
      const lvl = levels[levelIndex];

      const sponsor = await UserModel.findById(sponsorId).select(
        "username sponserId walletAddress isVerified levelIncome totalEarnings currentEarnings mainWallet",
      );

      if (!sponsor) break;

      // =========================
      // SKIP UNVERIFIED (IMPORTANT FIX)
      // =========================
      if (!sponsor.isVerified) {
        sponsorId = sponsor.sponserId;
        continue;
      }

      const income = (roiAmount * lvl.percent) / 100;

      if (income > 0) {
        // =========================
        // DUPLICATE CHECK (SAFE)
        // =========================
        const exists = await LevelIncome.findOne({
          userId: sponsor._id,
          fromUserId: fromUser._id,
          investmentId: investment._id,
          level: lvl.level,
          creditedAt: today,
        });

        if (!exists) {
          // =========================
          // LEDGER CREATE
          // =========================
          const levelDoc = await LevelIncome.create({
            userId: sponsor._id,
            fromUserId: fromUser._id,
            fromUserName: fromUser.username,
            toUserName: sponsor.username,
            investmentId: investment._id,
            amount: income,
            roi: roiAmount,
            level: lvl.level,
            percent: lvl.percent,
            creditedAt: today,
            status: "pending_onchain",
          });

          // =========================
          // DB WALLET UPDATE
          // =========================
          await UserModel.updateOne(
            { _id: sponsor._id },
            {
              $inc: {
                levelIncome: income,
                totalEarnings: income,
                currentEarnings: income,
                mainWallet: income,
              },
            },
          );

          console.log(
            `🧾 Level ${lvl.level} | ${sponsor.username} | $${income}`,
          );

          // =========================
          // ONCHAIN (SAFE OPTIONAL)
          // =========================
          let status = "failed_onchain";

          if (sponsor.walletAddress) {
            const success = await creditLevelIncomeOnChain(
              sponsor.walletAddress,
              income,
            );

            if (success) status = "confirmed_onchain";
          }

          await LevelIncome.updateOne(
            { _id: levelDoc._id },
            {
              $set: {
                status,
                onchainAt: new Date(),
              },
            },
          );

          console.log(
            `⛓️ ${status} | ${sponsor.username} | Level ${lvl.level}`,
          );
        }
      }

      // =========================
      // MOVE BOTH POINTERS (CRITICAL)
      // =========================
      sponsorId = sponsor.sponserId;
      levelIndex++;
    }
  } catch (err) {
    console.error("❌ Level income error:", err.message);
  }
};
