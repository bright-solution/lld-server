// ─────────────────────────────────────────────────────────────────
// POST /api/transactions/lld-buy
// Frontend se transaction success ke baad call hota hai
// ─────────────────────────────────────────────────────────────────
import LldTransaction from "../models/distributionSchema.model.js";
export const saveLldBuy = async (req, res) => {
  try {
    const {
      txHash,
      blockNumber,
      buyer,
      usdtEquivalent,
      ethSpent,
      ethPriceUSD,
      contractAddress,
      refs,
      distribution,
      timestamp,
      userId,
    } = req.body;

    // ── Basic validation ──────────────────────────────────────
    if (!txHash || !buyer || !blockNumber) {
      return res.status(400).json({
        success: false,
        message: "txHash, buyer aur blockNumber required hain",
      });
    }

    if (!usdtEquivalent || Number(usdtEquivalent) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid usdtEquivalent amount",
      });
    }

    // ── Duplicate check — ek hi txHash dobara save na ho ─────
    const existing = await LldTransaction.findOne({
      txHash: txHash.toLowerCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Ye transaction already save hai",
        data: existing,
      });
    }

    // ── Save transaction ──────────────────────────────────────
    const newTx = await LldTransaction.create({
      txHash: txHash.toLowerCase().trim(),
      blockNumber: Number(blockNumber),
      contractAddress: contractAddress?.toLowerCase().trim() || "",
      userId: userId || null,
      buyer: buyer.toLowerCase().trim(),
      usdtEquivalent: Number(usdtEquivalent),
      ethSpent: ethSpent?.toString() || "0",
      ethPriceUSD: ethPriceUSD ? Number(ethPriceUSD) : null,
      refs: {
        ref1: refs?.ref1?.toLowerCase() || null,
        ref2: refs?.ref2?.toLowerCase() || null,
        ref3: refs?.ref3?.toLowerCase() || null,
      },
      distribution: distribution
        ? {
            totalLLD: distribution.totalLLD || "0",
            userShare: distribution.userShare || "0",
            ref1Share: distribution.ref1Share || "0",
            ref2Share: distribution.ref2Share || "0",
            ref3Share: distribution.ref3Share || "0",
            adminShare: distribution.adminShare || "0",
            spentETH: distribution.spentETH || "0",
          }
        : null,
      status: "success",
      txTimestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Transaction successfully saved",
      data: newTx,
    });
  } catch (error) {
    console.error("saveLldBuy error:", error);

    // Duplicate key error (race condition edge case)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate transaction — already saved",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/transactions/lld-buy/user/:walletAddress
// Kisi bhi wallet ka saara transaction history
// ─────────────────────────────────────────────────────────────────
export const getUserTransactions = async (req, res) => {
  try {
    // ✅ walletAddress seedha req.user se lo — extra DB query nahi
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address not found on your account",
      });
    }

    // ✅ Pagination — frontend ?page=1&limit=8 bhejta hai
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 8); // max 50 cap
    const skip = (page - 1) * limit;

    const query = { buyer: walletAddress.toLowerCase() };

    // ✅ count aur data ek saath fetch karo
    const [data, total] = await Promise.all([
      LldTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LldTransaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data,
      message: "Transactions fetched successfully",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getUserTransactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/transactions/lld-buy/referral/:walletAddress
// Kisi wallet ke referral se kitna commission aaya
// ─────────────────────────────────────────────────────────────────
export const getReferralStats = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res
        .status(400)
        .json({ success: false, message: "walletAddress required hai" });
    }

    const wallet = walletAddress.toLowerCase();

    // Ye wallet kisi bhi level me referral tha — sab dhundho
    const transactions = await LldTransaction.find({
      $or: [
        { "refs.ref1": wallet },
        { "refs.ref2": wallet },
        { "refs.ref3": wallet },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // ── Commission calculate karo ──────────────────────────────
    let totalRef1 = BigInt(0);
    let totalRef2 = BigInt(0);
    let totalRef3 = BigInt(0);

    transactions.forEach((tx) => {
      if (!tx.distribution) return;
      if (tx.refs?.ref1 === wallet)
        totalRef1 += BigInt(tx.distribution.ref1Share || "0");
      if (tx.refs?.ref2 === wallet)
        totalRef2 += BigInt(tx.distribution.ref2Share || "0");
      if (tx.refs?.ref3 === wallet)
        totalRef3 += BigInt(tx.distribution.ref3Share || "0");
    });

    const totalEarned = totalRef1 + totalRef2 + totalRef3;

    return res.status(200).json({
      success: true,
      wallet,
      referralStats: {
        totalTransactions: transactions.length,
        totalEarned: totalEarned.toString(), // total LLD (wei)
        asRef1: {
          count: transactions.filter((t) => t.refs?.ref1 === wallet).length,
          lld: totalRef1.toString(),
        },
        asRef2: {
          count: transactions.filter((t) => t.refs?.ref2 === wallet).length,
          lld: totalRef2.toString(),
        },
        asRef3: {
          count: transactions.filter((t) => t.refs?.ref3 === wallet).length,
          lld: totalRef3.toString(),
        },
      },
      transactions,
    });
  } catch (error) {
    console.error("getReferralStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/transactions/lld-buy/stats
// Admin ke liye overall stats
// ─────────────────────────────────────────────────────────────────
export const getOverallStats = async (req, res) => {
  try {
    const [totalTx, totalVolumeAgg] = await Promise.all([
      LldTransaction.countDocuments({ status: "success" }),
      LldTransaction.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: null,
            totalUSDT: { $sum: "$usdtEquivalent" },
            uniqueBuyers: { $addToSet: "$buyer" },
          },
        },
      ]),
    ]);

    const agg = totalVolumeAgg[0] || {};

    return res.status(200).json({
      success: true,
      stats: {
        totalTransactions: totalTx,
        totalVolumeUSDT: agg.totalUSDT || 0,
        uniqueBuyers: agg.uniqueBuyers?.length || 0,
      },
    });
  } catch (error) {
    console.error("getOverallStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
