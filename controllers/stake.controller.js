import Stake from "../models/stake.model.js";
import UserModel from "../models/user.model.js";

const LOCK_PERIOD_DAYS = 365;
const LOCK_PERIOD_MS = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;
export const createStake = async (req, res) => {
  try {
    const { walletAddress, stakeAmount, txHash } = req.body;
    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!walletAddress || !stakeAmount || !txHash) {
      return res.status(400).json({
        success: false,
        message: "walletAddress, stakedAmount aur txHash required hain.",
      });
    }

    if (isNaN(stakeAmount) || Number(stakeAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stake amount.",
      });
    }

    const alreadyExists = await Stake.findOne({ txHash });
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "TxHash already exists. ",
      });
    }

    // Lock period calculation — 1 year
    const startDate = new Date();
    const unlockDate = new Date(startDate.getTime() + LOCK_PERIOD_MS);
    const stake = await Stake.create({
      userId,
      walletAddress: walletAddress.toLowerCase(),
      stakedAmount: Number(stakeAmount),
      txHash,
      status: "active",
      startDate,
      unlockDate,
      endDate: unlockDate,
      lockPeriodDays: LOCK_PERIOD_DAYS,
      isLocked: true,
    });
    const wasZero = user.totalInvestment === 0;
    user.totalInvestment += Number(stakeAmount);
    if (wasZero) {
      user.isVerified = true;
      user.activeDate = new Date();
    }

    await user.save();
    return res.status(201).json({
      success: true,
      message: "Staking completed Enjoy your rewards.",
    });
  } catch (err) {
    console.log("[createStake]", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/stake/my-stakes
//  Logged-in user ke saare stakes
// ─────────────────────────────────────────────────────────────────────────────
export const getMyStakes = async (req, res) => {
  try {
    const userId = req.user._id;

    const data = await Stake.find({ userId });
    if (!data || data.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "No stakes found." });
    }

    return res
      .status(200)
      .json({ success: true, data, message: "Stakes fetched successfully" });
  } catch (err) {
    console.error("[getMyStakes]", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
