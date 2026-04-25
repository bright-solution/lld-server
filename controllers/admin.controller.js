import Admin from "../models/admin.model.js";
import Investment from "../models/investment.model.js";
import LevelIncome from "../models/LevelIncome.model.js";
import ReferalBonus from "../models/referalbonus.model.js";
import Aroi from "../models/roi.model.js";
import Support from "../models/support.model.js";
import UserModel from "../models/user.model.js";
import Withdrawal from "../models/withdrwal.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path, { dirname } from "path";
import fs from "fs";
import Banner from "../models/banner.model.js";
import { fileURLToPath } from "url";
import Settings from "../models/settings.model.js";
import MonthlyRewards from "../models/monthlyRewards.js";
import OneTimeReward from "../models/oneTime.model.js";
import { generateRandomTxResponse } from "../utils/Random.js";
import { AdminTopUp } from "../models/adminTopUp.model.js";
import Level from "../models/level.model.js";
import Package from "../models/Package.model.js";
import { distributeLevelIncomeOnRoi } from "../utils/levelIncome.js";
import Bonus from "../models/bonus.model.js";
import Stake from "../models/stake.model.js";
import StakingIncome from "../models/Stakingincome.model.js";
import LldTransaction from "../models/distributionSchema.model.js";

export const adminRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "All Feild are requireds",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      email,
      password: hashPassword,
    });
    if (!newAdmin) {
      return res.status(400).json({
        message: "User Not Created",
        success: false,
      });
    }
    const admin = await newAdmin.save();

    return res.status(200).json({
      message: "Register Successfull",
      success: true,
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const user = await Admin.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie and send response
    return res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure in production
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token,
        data: {
          _id: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          // Only return necessary fields, avoid sending password hash
        },
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};
export const getProfile = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: "User Profile",
      data: user,
      success: true,
    });
  } catch (error) {}
};
export const getDailyRoi = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const dailyRoi = await Aroi.find({})
      .populate("userId investmentId")
      .sort({ date: -1 });
    return res.status(200).json({
      message: "All User DailyRoi History",
      data: dailyRoi,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const allUsers = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const users = await UserModel.find()
      .select(
        "username walletAddress totalInvestment totalEarnings isVerified createdAt totalPayouts",
      )
      .lean();
    if (!users || users.length === 0) {
      return res.status(200).json({
        message: "No users found",
        data: [],
        success: true,
      });
    }

    return res.status(200).json({
      message: "All Users",
      data: users,
      success: true,
    });
  } catch (error) {
    console.error("Error in allUsers:", error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exct();
    if (!users) {
      return res.status(200).json({
        message: "no users",
        data: [],
      });
    }

    return res.status(200).json({
      message: "All Users",
      data: users,
    });
  } catch (error) {}
};
export const getAllLevelIncome = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const levelIncome = await LevelIncome.find({}).populate(
      "userId fromUserId",
    );
    return res.status(200).json({
      message: "All User Level Income History",
      data: levelIncome,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getAllReferalBonus = async (req, res) => {
  try {
    const userId = req.admin || req.user;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const referalBonus = await ReferalBonus.find({})
      .lean()
      .populate({
        path: "userId fromUser",
        select: "username walletAddress",
      })
      .populate("investmentId")
      .sort({ createdAt: -1 });
    if (!referalBonus) {
      return res.status(200).json({
        message: "No referal bonus found",
      });
    }
    return res.status(200).json({
      message: "All User Referal Bonus History",
      data: referalBonus,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getAllIncomes = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalUsers = await UserModel.countDocuments();

    // Active users = users with at least one active stake
    const activeUserIds = await Stake.distinct("userId", { status: "active" });
    const activeUsers = activeUserIds.length;
    const inactiveUsers = totalUsers - activeUsers;

    const todayUsers = await UserModel.find({
      investmentDate: { $gte: todayStart, $lte: todayEnd },
    });

    const stakeStats = await Stake.aggregate([
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalStaked: { $sum: "$stakedAmount" },
                totalCount: { $sum: 1 },
              },
            },
          ],
          today: [
            { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
            {
              $group: {
                _id: null,
                todayStaked: { $sum: "$stakedAmount" },
                todayCount: { $sum: 1 },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                amount: { $sum: "$stakedAmount" },
                count: { $sum: 1 },
              },
            },
          ],
          activeStakeAmount: [
            { $match: { status: "active" } },
            {
              $group: {
                _id: null,
                amount: { $sum: "$stakedAmount" },
              },
            },
          ],
        },
      },
    ]);

    const totalStakedAmount = stakeStats[0].total[0]?.totalStaked || 0;
    const todayStakedAmount = stakeStats[0].today[0]?.todayStaked || 0;

    const stakeStatusBreakdown = {
      active: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };
    stakeStats[0].byStatus.forEach((s) => {
      if (stakeStatusBreakdown[s._id]) {
        stakeStatusBreakdown[s._id] = { count: s.count, amount: s.amount };
      }
    });

    // ============================================
    // STAKING ROI INCOME — daily ROI credited to users
    // ============================================
    const stakingIncomeStats = await StakingIncome.aggregate([
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalIncome: { $sum: "$incomeAmount" },
              },
            },
          ],
          today: [
            { $match: { creditedAt: { $gte: todayStart, $lte: todayEnd } } },
            {
              $group: {
                _id: null,
                todayIncome: { $sum: "$incomeAmount" },
              },
            },
          ],
        },
      },
    ]);
    const totalStakingRoi = stakingIncomeStats[0].total[0]?.totalIncome || 0;
    const todayStakingRoi = stakingIncomeStats[0].today[0]?.todayIncome || 0;

    // ============================================
    // WITHDRAWAL STATS — with status breakdown
    // ============================================
    const withdrawalStats = await Withdrawal.aggregate([
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
                totalNetSent: { $sum: "$netAmountSent" },
                totalFees: { $sum: "$feeAmount" },
                count: { $sum: 1 },
              },
            },
          ],
          today: [
            { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
            {
              $group: {
                _id: null,
                todayAmount: { $sum: "$amount" },
                todayNetSent: { $sum: "$netAmountSent" },
                count: { $sum: 1 },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const totalWithdrawals = withdrawalStats[0].total[0]?.totalAmount || 0;

    const todayWithdrawal = withdrawalStats[0].today[0]?.todayAmount || 0;

    const withdrawalStatusBreakdown = {
      pending: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
    };
    withdrawalStats[0].byStatus.forEach((s) => {
      if (withdrawalStatusBreakdown[s._id]) {
        withdrawalStatusBreakdown[s._id] = { count: s.count, amount: s.amount };
      }
    });

    return res.status(200).json({
      message: "Platform Income Summary",
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          todayUsers: todayUsers.length,
        },

        investment: {
          totalStakedAmount,
          todayStakedAmount,
        },

        roiIncome: {
          total: totalStakingRoi,
          today: todayStakingRoi,
        },

        withdrawal: {
          totalAmount: totalWithdrawals,
          todayAmount: todayWithdrawal,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllIncomes:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getTotalInvestedUsers = async (_, res) => {
  try {
    const allInvestUsers = await Investment.find({})
      .populate("userId", "username walletAddress")
      .lean()
      .exec();
    if (!allInvestUsers) {
      return res.status(200).json({
        message: "No Invested Users",
        success: false,
      });
    }

    return res.status(200).json({
      message: "All Invested Users",
      success: false,
      data: allInvestUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "server error",
      success: false,
    });
  }
};

export const getLevelIncomeHistory = async (_, res) => {
  try {
    const getAllLevelIncomes = await LevelIncome.find({})
      .lean()
      .sort({ createdAt: -1 })
      .populate({
        path: "userId fromUserId",
        select: "username walletAddress levelIncome",
      });

    if (!getAllLevelIncomes) {
      return res.status(404).json({
        message: "No Level Income History Found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "LevelIncome History",
      success: true,
      data: getAllLevelIncomes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Errro",
    });
  }
};

export const getAllMessage = async (req, res) => {
  try {
    const allTickets = await Support.find({}).sort({ createdAt: -1 });
    if (!allTickets) {
      return res.sta(200).json({
        messae: "No Tickets Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All Tickets Fetched",
      success: false,
      data: allTickets,
    });
  } catch (error) {}
};

export const ticketApprove = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id && message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Approved";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Approved Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const ticketReject = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id  & message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Rejected";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Rejected Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const getRoiHistory = async (req, res) => {
  try {
    const roiHistories = await Aroi.find({})
      .populate({
        path: "userId",
        select: "username walletAddress",
      })
      .populate("investmentId", "totalRoiEarned")
      .lean();
    if (!roiHistories) {
      return res.status(200).json({
        message: "Roi history not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "ROI History Fetched",
      success: false,
      data: roiHistories,
    });
  } catch (error) {}
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let currentBanner = null;
export const uploadBanner = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        message: "title is required",
        success: false,
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No banner uploaded" });
    }

    const newBanner = new Banner({
      imageUrl: `/uploads/banners/${req.file.filename}`,
      title: title,
    });

    await newBanner.save();

    res.status(201).json({
      message: "Banner uploaded successfully",
      banner: newBanner,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Banner upload failed", error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Banners fetched successfully",
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch banners",
      success: false,
      error: error.message,
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const imagePath = path.join(__dirname, ".. ", banner.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete banner", error: error.message });
  }
};

export const updateGlobalLimit = async (req, res) => {
  const { newLimit } = req.body;

  if (!newLimit || isNaN(newLimit)) {
    return res.status(400).json({ message: "Invalid limit" });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ withdrawalLimit: newLimit });
    } else {
      settings.withdrawalLimit = newLimit;
      await settings.save();
    }

    res.json({ message: "Global withdrawal limit updated", success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
};

export const allWithdrwal = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(400).json({
        messae: "Please Login First",
        success: false,
      });
    }

    const allWithdrwals = await Withdrawal.find({}).populate("userId");
    if (!allWithdrwals) {
      return res.status(200).json({
        message: "No Withdrwal Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All withdrwal fetched",
      success: true,
      data: allWithdrwals,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.messae || "Server Error",
      success: false,
    });
  }
};

export const monthlyIncomeHistory = async (req, res) => {
  try {
    const userId = req.admin._id;

    if (!userId) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const monthlyHistory = await MonthlyRewards.find({}).populate({
      path: "userId",
      select: "username",
    });
    if (!monthlyHistory || monthlyHistory.length === 0) {
      return res.status(200).json({
        message: "No History Found",
        success: true,
        data: [],
      });
    }

    return res.status(200).json({
      message: "History fetched Successfully",
      success: true,
      data: monthlyHistory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Monthly History Error",
      success: false,
    });
  }
};

export const getOneTimeTeamRewardsHistory = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(404).json({
        message: "user not found",
        success: false,
      });
    }

    const oneTimeHistory = await OneTimeReward.find({}).populate({
      path: "userId",
      select: "username",
    });

    if (!oneTimeHistory || oneTimeHistory.length === 0) {
      return res.status(200).json({
        message: "No History Found",
        success: true,
        data: [],
      });
    }

    return res.status(200).json({
      message: "History Fetched Successfully",
      success: true,
      data: oneTimeHistory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "One Time Rewards Error",
      success: false,
    });
  }
};

export const adminManualAddMoney = async (req, res) => {
  try {
    const { username, amount } = req.body;
    if (!username || !amount) {
      return res.status(400).json({
        message: "Username or amount is required",
        success: false,
      });
    }

    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
        success: false,
      });
    }

    const txhash = await generateRandomTxResponse();

    const investment = await Investment.create({
      userId: user._id,
      investmentAmount: amount,
      investmentDate: Date.now(),
      txResponse: txhash,
      type: "topup By Admin",
    });

    user.investments.push(investment._id);
    user.totalInvestment += Number(amount);
    user.isVerified = true;
    user.status = true;
    user.activeDate = new Date();
    await user.save();

    await AdminTopUp.create({
      userId: user._id,
      amount,
      creditedOn: Date.now(),
    });

    if (user.sponserId) {
      const parentUser = await UserModel.findById(user.sponserId);

      if (parentUser) {
        const referralBonus = amount * 0.05;

        parentUser.directReferalAmount += referralBonus;
        parentUser.totalEarnings += referralBonus;
        parentUser.currentEarnings += referralBonus;
        await parentUser.save();

        await ReferalBonus.create({
          userId: parentUser._id,
          fromUser: user._id,
          amount: referralBonus,
          investmentId: investment._id,
          percent: 5,
          date: new Date(),
        });
      }
    }

    return res.status(200).json({
      message: "User TopUp successfully",
      success: true,
      investment,
    });
  } catch (error) {
    console.error("Error in AdminTopUp:", error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};

export const toggleWithdrawalAccess = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await UserModel.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: { canWithdraw: !user.canWithdraw } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: `Withdrawal ${
        updatedUser.canWithdraw ? "unblocked" : "blocked"
      } successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in toggleWithdrawalAccess:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const toggleUserLogin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await UserModel.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: { isLoginBlocked: !user.isLoginBlocked } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: `User login ${
        updatedUser.isLoginBlocked ? "blocked" : "unblocked"
      } successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in toggleUserLogin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getLevelConfiguration = async (req, res) => {
  try {
    const config = await Level.find();
    res.status(200).json({
      success: true,
      message: "Level configuration fetched successfully",
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().lean().exec();
    res.status(200).json({
      success: true,
      message: "Packages fetched successfully",
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePackages = async (req, res) => {
  try {
    const { packageId, name, price, dailyROI, maxPrice } = req.body;
    const admin = req.admin;

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!packageId || !name || !price || !dailyROI) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const updatedPackage = await Package.findOneAndUpdate(
      { _id: packageId },
      { $set: { name, price, dailyROI, maxPrice } },
      { new: true },
    );

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateLevelConfig = async (req, res) => {
  try {
    const { level, percent } = req.body;
    if (!level || !percent) {
      return res.status(404).json({
        messae: "All Feilds are required",
        success: false,
      });
    }
    const updateLevel = await Level.findOneAndUpdate(
      { level },
      {
        $set: { level, percent },
      },
      { new: true },
    );
    if (!updateLevel) {
      return res.status(400).json({
        message: " Error in Updating Level",
        success: false,
      });
    }

    return res.status(200).json({
      messae: "Level Updated Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messae: "Error in Updating Level",
      success: false,
    });
  }
};

const updateUplineBusiness = async (sponserId, amount) => {
  let currentUserId = sponserId;

  while (currentUserId) {
    const updatedUser = await UserModel.findByIdAndUpdate(
      currentUserId,
      { $inc: { totalBusiness: amount } },
      { new: true },
    );
    if (!updatedUser) break;

    console.log(
      "Updated totalBusiness:",
      updatedUser.username,
      updatedUser.totalBusiness,
    );

    currentUserId = updatedUser.sponserId;
  }
};
// export const adminInvestment = async (req, res) => {
//   try {
//     const { investmentAmount, username, planName, dailyROI } = req.body;

//     if (!investmentAmount || !username) {
//       return res.status(400).json({
//         success: false,
//         message: "investmentAmount and username are required",
//       });
//     }

//     const user = await UserModel.findOne({ username });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const isFirstInvestment = !user.isVerified;

//     const amount = Number(investmentAmount);

//     // ✅ DEFAULTS (admin can override)
//     const name = planName || "Admin Plan";
//     const roi = dailyROI || 0.02;

//     // ✅ CALCULATE DEPOSIT BONUS
//     let depositBonusPercent = 0;

//     if (amount >= 1000) depositBonusPercent = 1;
//     else if (amount >= 500) depositBonusPercent = 2;
//     else if (amount >= 250) depositBonusPercent = 4;
//     else if (amount >= 100) depositBonusPercent = 6;
//     else if (amount >= 50) depositBonusPercent = 8;
//     else if (amount >= 25) depositBonusPercent = 10;

//     const depositBonusAmount = (amount * depositBonusPercent) / 100;

//     // ✅ CREATE INVESTMENT
//     const newInvestment = await Investment.create({
//       userId: user._id,
//       investmentAmount: amount,
//       usdtAmount: amount,
//       txHash: await generateRandomTxResponse(),
//       addedBy: "admin",
//       activeInvestment: amount,
//       totalRoiEarned: 0,
//       dayCount: 0,
//       status: "active",
//       name,
//       dailyROI: roi,
//       nextRoi: amount * roi,
//       investmentDate: new Date(),
//     });
//     await Bonus.create({
//       userId: user._id,
//       bonus: depositBonusAmount,
//       baseAmount: amount,
//     });
//     user.activePlans = user.activePlans || [];
//     user.activePlans.push({
//       planId: null,
//       name,
//       amount,
//       investmentId: newInvestment._id,
//       date: new Date(),
//     });

//     user.investments.push(newInvestment._id);
//     user.totalInvestment = (user.totalInvestment || 0) + amount;

//     if (depositBonusAmount > 0) {
//       user.currentEarnings = (user.currentEarnings || 0) + depositBonusAmount;

//       user.totalEarnings = (user.totalEarnings || 0) + depositBonusAmount;

//       user.depositBonus = (user.depositBonus || 0) + depositBonusAmount;
//     }

//     user.isVerified = true;
//     user.status = true;
//     user.activeDate = new Date();

//     await user.save();

//     if (isFirstInvestment && user.sponserId) {
//       let currentSponsorId = user.sponserId;
//       let level = 1;

//       while (currentSponsorId && level <= 10) {
//         await UserModel.updateOne(
//           { _id: currentSponsorId },
//           {
//             $inc: {
//               validTotalTeam: 1,
//               [`validLevelWiseTeam.${level}`]: 1,
//             },
//           },
//         );

//         const sponsor = await UserModel.findById(currentSponsorId);
//         currentSponsorId = sponsor?.sponserId;
//         level++;
//       }
//     }

//     if (user.sponserId) {
//       await updateUplineBusiness(user.sponserId, amount);
//     }

//     // ✅ LEVEL INCOME
//     await distributeLevelIncomeOnRoi(user, amount, newInvestment._id);

//     return res.status(201).json({
//       success: true,
//       message: "Admin Investment Added Successfully.",
//       investment: newInvestment,
//       activePlans: user.activePlans,
//       depositBonus: depositBonusAmount,
//     });
//   } catch (error) {
//     console.error("Error in Admin Investment:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
export const adminInvestment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { investmentAmount, username, planName, dailyROI } = req.body;

    if (!investmentAmount || !username) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "investmentAmount and username are required",
      });
    }

    const user = await UserModel.findOne({ username }).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFirstInvestment = !user.isVerified;
    const amount = Number(investmentAmount);

    const name = planName || "Admin Plan";
    const roi = dailyROI || 0.02;

    // ✅ BONUS CALCULATION
    let depositBonusPercent = 0;
    if (amount >= 1000) depositBonusPercent = 1;
    else if (amount >= 500) depositBonusPercent = 2;
    else if (amount >= 250) depositBonusPercent = 4;
    else if (amount >= 100) depositBonusPercent = 6;
    else if (amount >= 50) depositBonusPercent = 8;
    else if (amount >= 25) depositBonusPercent = 10;

    const depositBonusAmount = (amount * depositBonusPercent) / 100;

    // ✅ CREATE INVESTMENT
    const newInvestment = await Investment.create(
      [
        {
          userId: user._id,
          investmentAmount: amount,
          usdtAmount: amount,
          txHash: await generateRandomTxResponse(),
          addedBy: "admin",
          activeInvestment: amount,
          totalRoiEarned: 0,
          dayCount: 0,
          status: "active",
          name,
          dailyROI: roi,
          nextRoi: amount * roi,
          investmentDate: new Date(),
        },
      ],
      { session },
    );

    // ✅ BONUS ENTRY
    await Bonus.create(
      [
        {
          userId: user._id,
          bonus: depositBonusAmount,
          baseAmount: amount,
          percent: depositBonusPercent,
        },
      ],
      { session },
    );

    // ✅ USER UPDATE
    user.activePlans = user.activePlans || [];
    user.activePlans.push({
      planId: null,
      name,
      amount,
      investmentId: newInvestment[0]._id,
      date: new Date(),
    });

    user.investments.push(newInvestment[0]._id);
    user.totalInvestment = (user.totalInvestment || 0) + amount;

    if (depositBonusAmount > 0) {
      user.currentEarnings = (user.currentEarnings || 0) + depositBonusAmount;
      user.totalEarnings = (user.totalEarnings || 0) + depositBonusAmount;
      user.depositBonus = (user.depositBonus || 0) + depositBonusAmount;
    }

    user.isVerified = true;
    user.status = true;
    user.activeDate = new Date();

    await user.save({ session });

    // ✅ SPONSOR TREE UPDATE
    if (isFirstInvestment && user.sponserId) {
      let currentSponsorId = user.sponserId;
      let level = 1;

      while (currentSponsorId && level <= 10) {
        await UserModel.updateOne(
          { _id: currentSponsorId },
          {
            $inc: {
              validTotalTeam: 1,
              [`validLevelWiseTeam.${level}`]: 1,
            },
          },
          { session },
        );

        const sponsor =
          await UserModel.findById(currentSponsorId).session(session);
        currentSponsorId = sponsor?.sponserId;
        level++;
      }
    }

    // ⚠️ IMPORTANT: session pass karo
    if (user.sponserId) {
      await updateUplineBusiness(user.sponserId, amount, session);
    }

    await distributeLevelIncomeOnRoi(
      user,
      amount,
      newInvestment[0]._id,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Admin Investment Added Successfully.",
      investment: newInvestment[0],
      activePlans: user.activePlans,
      depositBonus: depositBonusAmount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error in Admin Investment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllSalaryIncomeHistory = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
    const salaryIncomeHistory = await MonthlyRewards.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Salary Income History fetched successfully",
      data: salaryIncomeHistory,
    });
  } catch (error) {
    console.error("Error in getAllSalaryIncomeHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getCarFundingIncomeHistory = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
    const carFundingIncomeHistory = await OneTimeReward.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Car Funding Income History fetched successfully",
      data: carFundingIncomeHistory,
    });
  } catch (error) {
    console.error("Error in getCarFundingIncomeHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllDepositBonus = async (req, res) => {
  try {
    const depositBonuses = await Bonus.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Deposit Bonuses fetched successfully",
      data: depositBonuses,
    });
  } catch (error) {
    console.error("Error in getAllDepositBonuses:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const getStakeIncomeHistory = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
    const stakeIncomeHistory = await StakingIncome.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Stake Income History fetched successfully",
      data: stakeIncomeHistory,
    });
  } catch (error) {
    console.error("Error in getStakeIncomeHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getDepositHistory = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
    const depositHistory = await Stake.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Deposit History fetched successfully",
      data: depositHistory,
    });
  } catch (error) {
    console.error("Error in getDepositHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
    const withdrawals = await Withdrawal.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Withdrawals fetched successfully",
      data: withdrawals,
    });
  } catch (error) {
    console.error("Error in getAllWithdrawals:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllLLDBuyHistory = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
    const lldBuyHistory = await LldTransaction.find()
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "LLD Buy History fetched successfully",
      data: lldBuyHistory,
    });
  } catch (error) {
    console.error("Error in getAllLLDBuyHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const changeStakeHistoryAddress = async (req, res) => {
  try {
    const adminId = req.admin._id;

    if (!adminId) {
      return res.status(401).json({
        message: "You are not authorized",
        success: false,
      });
    }

    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        message: "New wallet address is required",
        success: false,
      });
    }

    let settings = await Settings.findOne();

    // 👉 agar nahi mila to create karo
    if (!settings) {
      settings = await Settings.create({ walletAddress });
    } else {
      settings.walletAddress = walletAddress;
      await settings.save();
    }

    return res.status(200).json({
      message: "Stake wallet address updated successfully",
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error in changeStakeHistoryAddress:", error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};
export const changePrivateKey = async (req, res) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        message: "New private key is required",
        success: false,
      });
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { privateKey },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      message: "Private key updated successfully",
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error in changePrivateKey:", error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({
        message: "Settings not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Settings fetched successfully",
      success: true,
      data: {
        privateKey: settings.privateKey
          ? settings.privateKey.slice(0, 4) +
            "..." +
            settings.privateKey.slice(-4)
          : null,
        walletAddress: settings.walletAddress || null,
      },
    });
  } catch (error) {
    console.error("Error in getSettings:", error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};
