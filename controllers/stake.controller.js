import Stake from "../models/stake.model.js";

export const createStake = async (req, res) => {
  try {
    const { walletAddress, stakedAmount, txHash } = req.body;
    const userId = req.user._id;

    if (!walletAddress || !stakedAmount || !txHash) {
      return res.status(400).json({
        success: false,
        message: "walletAddress, stakedAmount aur txHash required hain.",
      });
    }

    if (isNaN(stakedAmount) || Number(stakedAmount) <= 0) {
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

    const stake = await Stake.create({
      userId,
      walletAddress: walletAddress.toLowerCase(),
      stakedAmount: Number(stakedAmount),
      txHash,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Stake save ho gaya!",
      data: {
        stakeId: stake._id,
        stakedAmount: stake.stakedAmount,
        dailyReward: stake.dailyRewardAmount,
        monthlyReward: stake.totalExpectedReward,
        startDate: stake.startDate,
        endDate: stake.endDate,
        txHash: stake.txHash,
      },
    });
  } catch (err) {
    console.error("[createStake]", err.message);
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
