import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { generateReferralCode, randomUsername } from "../utils/Random.js";
import { buildTree } from "../utils/BinaryTree.js";
import { getBinaryDownline } from "../utils/Downline.js";
import Investment from "../models/investment.model.js";
import Aroi from "../models/roi.model.js";
import Plan from "../models/plan.model.js";
import Support from "../models/support.model.js";
import Withdrawal from "../models/withdrwal.model.js";
import LevelIncome from "../models/LevelIncome.model.js";
import ReferalBonus from "../models/referalbonus.model.js";
import OneTimeReward from "../models/oneTime.model.js";
import MonthlyRewards from "../models/monthlyRewards.js";
import Package from "../models/Package.model.js";
import { distributeLevelIncomeOnRoi } from "../utils/levelIncome.js";
import mongoose from "mongoose";
import PlacementQueue from "../models/placementQueue.model.js";
import Bonus from "../models/bonus.model.js";
import { sendWelcomeEmail } from "../utils/sendMail.js";
import Stake from "../models/stake.model.js";
import StakingIncome from "../models/Stakingincome.model.js";
import { create } from "domain";

const findAvailablePosition = async (parentId) => {
  const queue = [parentId];

  while (queue.length > 0) {
    const currentUserId = queue.shift();
    const currentUser = await UserModel.findById(currentUserId);

    if (!currentUser) continue;

    if (!currentUser.left) {
      return { parent: currentUserId, position: "left" };
    }
    queue.push(currentUser.left);

    if (!currentUser.right) {
      return { parent: currentUserId, position: "right" };
    }
    queue.push(currentUser.right);
  }

  return null;
};
const updateUplineTeam = async (sponsorId) => {
  let currentUser = await UserModel.findById(sponsorId);

  let level = 1;

  while (currentUser && level <= 10) {
    const update = {};

    // total team++
    update.$inc = {
      totalTeam: 1,
      [`levelWiseTeam.${level}`]: 1,
    };

    await UserModel.updateOne({ _id: currentUser._id }, update);

    // move upline
    currentUser = await UserModel.findById(currentUser.sponserId);

    level++;
  }
};
// export const userRegister = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { walletAddress, referredBy } = req.body;

//     if (!walletAddress) {
//       throw new Error("Wallet address is required");
//     }

//     const wallet = walletAddress.toLowerCase();

//     // ==========================
//     // CHECK EXISTING USER
//     // ==========================
//     const existingUser = await UserModel.findOne({
//       walletAddress: wallet,
//     }).session(session);

//     if (existingUser) {
//       throw new Error("User already exists");
//     }

//     const referralCode = generateReferralCode();
//     const username = randomUsername();

//     let sponsorUser = null;
//     let sponsorId = null;

//     const userCount = await UserModel.countDocuments().session(session);

//     if (userCount !== 0) {
//       if (!referredBy) {
//         throw new Error("Referral code is required");
//       }

//       sponsorUser = await UserModel.findOne({
//         referralCode: referredBy,
//       }).session(session);

//       if (!sponsorUser) {
//         throw new Error("Invalid referral code");
//       }

//       sponsorId = sponsorUser._id;
//     }

//     // ==========================
//     // BUILD UPLINE (LEVEL 3)
//     // ==========================
//     let uplineWallets = [];

//     if (sponsorUser) {
//       let current = sponsorUser;
//       let level = 1;

//       while (current && level <= 3) {
//         if (current.walletAddress) {
//           uplineWallets.push(current.walletAddress);
//         }

//         if (!current.sponserId) break;

//         current = await UserModel.findById(current.sponserId).session(session);
//         level++;
//       }
//     }

//     // ==========================
//     // CREATE USER
//     // ==========================
//     const newUserArr = await UserModel.create(
//       [
//         {
//           walletAddress: wallet,
//           referralCode,
//           username,

//           sponserId: sponsorId,
//           parentReferedCode: referredBy || null,

//           uplineWallets,

//           referredUsers: [], // ✅ FIXED NAME
//           role: "user",

//           totalTeam: 0,
//           levelWiseTeam: {},
//         },
//       ],
//       { session },
//     );

//     const newUser = newUserArr[0];

//     // ==========================
//     // UPDATE SPONSOR
//     // ==========================
//     if (sponsorUser) {
//       await UserModel.updateOne(
//         { _id: sponsorUser._id },
//         {
//           $push: { referredUsers: newUser._id }, // ✅ SAME NAME
//           $inc: { totalTeam: 1 },
//         },
//         { session },
//       );
//     }

//     // ==========================
//     // COMMIT
//     // ==========================
//     await session.commitTransaction();
//     session.endSession();

//     // ==========================
//     // TOKEN
//     // ==========================
//     const token = jwt.sign(
//       {
//         id: newUser._id,
//         walletAddress: newUser.walletAddress,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" },
//     );

//     await newUser.save({ session });

//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       user: newUser,
//       token,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error("Register error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Registration failed",
//     });
//   }
// };

export const userRegister = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { walletAddress, referredBy=LLD9244 } = req.body;

    if (!walletAddress) {
      throw new Error("Wallet address is required");
    }

    const wallet = walletAddress.toLowerCase();

    // ==========================
    // CHECK EXISTING USER
    // ==========================
    const existingUser = await UserModel.findOne({
      walletAddress: wallet,
    }).session(session);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const referralCode = generateReferralCode();
    const username = randomUsername();

    let sponsorUser = null;
    let sponsorId = null;

    // ==========================
    // CHECK FIRST USER
    // ==========================
    const userCount = await UserModel.estimatedDocumentCount();

    if (userCount !== 0) {
      if (!referredBy) {
        throw new Error("Referral code is required");
      }

      sponsorUser = await UserModel.findOne({
        referralCode: referredBy,
      }).session(session);

      if (!sponsorUser) {
        throw new Error("Invalid referral code");
      }

      sponsorId = sponsorUser._id;
    }

    // ==========================
    // BUILD UPLINE (3 LEVEL)
    // ==========================
    let uplineWallets = [];

    if (sponsorUser) {
      let current = sponsorUser;
      let level = 1;

      while (current && level <= 3) {
        if (current.walletAddress) {
          uplineWallets.push(current.walletAddress);
        }

        if (!current.sponserId) break;

        current = await UserModel.findById(current.sponserId)
          .select("walletAddress sponserId")
          .session(session);

        level++;
      }
    }

    // ==========================
    // CREATE USER
    // ==========================
    const newUserArr = await UserModel.create(
      [
        {
          walletAddress: wallet,
          referralCode,
          username,

          sponserId: sponsorId || null,
          parentReferedCode: referredBy || null,

          uplineWallets,

          referredUsers: [],
          role: "user",

          totalTeam: 0,
          levelWiseTeam: {},
        },
      ],
      { session },
    );

    const newUser = newUserArr[0];

    // ==========================
    // UPDATE SPONSOR
    // ==========================
    if (sponsorUser) {
      await UserModel.updateOne(
        { _id: sponsorUser._id },
        {
          $push: { referredUsers: newUser._id },
          $inc: { totalTeam: 1 },
        },
        { session },
      );
    }

    // ==========================
    // GENERATE TOKEN
    // ==========================
    const token = jwt.sign(
      {
        id: newUser._id,
        walletAddress: newUser.walletAddress,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    newUser.currentToken = token;
    await newUser.save({ session });

    // ==========================
    // COMMIT TRANSACTION
    // ==========================
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
      token,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};
export const userLogin = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const wallet = walletAddress.toLowerCase();

    const user = await UserModel.findOne({ walletAddress: wallet });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "You are not registered yet, Please sign up first.",
      });
    }

    if (user.isLoginBlocked) {
      return res.status(403).json({
        success: false,
        message: "Login blocked. Contact support",
      });
    }

    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const userLogout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// const updateUplineBusiness = async (sponserId, amount) => {
//   let currentUserId = sponserId;

//   while (currentUserId) {
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       currentUserId,
//       { $inc: { totalBusiness: amount } },
//       { new: true },
//     );
//     if (!updatedUser) break;

//     console.log(
//       "Updated totalBusiness:",
//       updatedUser.username,
//       updatedUser.totalBusiness,
//     );

//     currentUserId = updatedUser.sponserId;
//   }
// };
// export const investment = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { packageId, txHash } = req.body;

//     if (!packageId || !txHash) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: "packageId and txHash are required",
//       });
//     }

//     const userId = req.user._id;

//     const plan = await Package.findById(packageId).session(session);
//     if (!plan) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: "Invalid plan selected",
//       });
//     }

//     const amount = plan.price;
//     const dailyROI = plan.dailyROI;
//     const name = plan.name;

//     const user = await UserModel.findById(userId).session(session);
//     if (!user) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const isFirstInvestment = !user.isVerified;

//     let depositBonusPercent = 0;
//     if (amount >= 1000) depositBonusPercent = 1;
//     else if (amount >= 500) depositBonusPercent = 2;
//     else if (amount >= 250) depositBonusPercent = 4;
//     else if (amount >= 100) depositBonusPercent = 6;
//     else if (amount >= 50) depositBonusPercent = 8;
//     else if (amount >= 25) depositBonusPercent = 10;

//     const depositBonusAmount = (amount * depositBonusPercent) / 100;

//     const newInvestment = await Investment.create(
//       [
//         {
//           userId,
//           packageId,
//           investmentAmount: amount,
//           usdtAmount: amount,
//           dailyROI,
//           txHash,
//           activeInvestment: amount,
//           totalRoiEarned: 0,
//           dayCount: 0,
//           status: "active",
//           name,
//           addedBy: "user",
//           nextRoi: amount * dailyROI,
//           investmentDate: new Date(),
//         },
//       ],
//       { session },
//     );

//     await Bonus.create(
//       [
//         {
//           userId: userId,
//           bonus: depositBonusAmount,
//           baseAmount: amount,
//           percent: depositBonusPercent,
//         },
//       ],
//       { session },
//     );

//     user.bonusAmount = (user.bonusAmount || 0) + depositBonusAmount;

//     user.activePlans = user.activePlans || [];
//     user.activePlans.push({
//       planId: packageId,
//       name,
//       amount,
//       investmentId: newInvestment[0]._id,
//       date: new Date(),
//     });

//     user.investments.push(newInvestment[0]._id);
//     user.totalInvestment = (user.totalInvestment || 0) + amount;

//     if (depositBonusAmount > 0) {
//       user.totalInvestment += depositBonusAmount;
//     }
//     user.isVerified = true;
//     user.status = true;
//     user.activeDate = new Date();

//     await user.save({ session });

//     // Sponsor updates
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
//           { session },
//         );

//         const sponsor =
//           await UserModel.findById(currentSponsorId).session(session);
//         currentSponsorId = sponsor?.sponserId;
//         level++;
//       }
//     }

//     if (user.sponserId) {
//       await updateUplineBusiness(user.sponserId, amount, session);
//     }

//     await distributeLevelIncomeOnRoi(
//       user,
//       amount,
//       newInvestment[0]._id,
//       session,
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       success: true,
//       message: "Package Purchased Successfully.",
//       investment: newInvestment[0],
//       activePlans: user.activePlans,
//       depositBonus: depositBonusAmount,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error("Error in Investment:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// export const investment = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { packageId, txHash } = req.body;

//     if (!packageId || !txHash) {
//       throw new Error("packageId and txHash are required");
//     }

//     const userId = req.user._id;

//     // check duplicate txHash
//     const existingTx = await Investment.findOne({ txHash }).session(session);
//     if (existingTx) {
//       throw new Error("Transaction already used");
//     }

//     // find package
//     const plan = await Package.findById(packageId).session(session);
//     if (!plan) {
//       throw new Error("Invalid plan selected");
//     }

//     const amount = plan.price;
//     const dailyROI = plan.dailyROI;
//     const name = plan.name;

//     // find user
//     const user = await UserModel.findById(userId).session(session);
//     if (!user) {
//       throw new Error("User not found");
//     }

//     const isFirstInvestment = !user.isVerified;

//     // deposit bonus
//     let depositBonusPercent = 0;

//     if (amount >= 1000) depositBonusPercent = 1;
//     else if (amount >= 500) depositBonusPercent = 2;
//     else if (amount >= 250) depositBonusPercent = 4;
//     else if (amount >= 100) depositBonusPercent = 6;
//     else if (amount >= 50) depositBonusPercent = 8;
//     else if (amount >= 25) depositBonusPercent = 10;

//     const depositBonusAmount = (amount * depositBonusPercent) / 100;

//     // create investment
//     const newInvestment = await Investment.create(
//       [
//         {
//           userId,
//           packageId,
//           investmentAmount: amount,
//           usdtAmount: amount,
//           dailyROI,
//           txHash,
//           activeInvestment: amount,
//           totalRoiEarned: 0,
//           dayCount: 0,
//           status: "active",
//           name,
//           addedBy: "user",
//           nextRoi: amount * (dailyROI / 100),
//           investmentDate: new Date(),
//         },
//       ],
//       { session },
//     );

//     // create bonus
//     if (depositBonusAmount > 0) {
//       await Bonus.create(
//         [
//           {
//             userId,
//             bonus: depositBonusAmount,
//             baseAmount: amount,
//             percent: depositBonusPercent,
//           },
//         ],
//         { session },
//       );
//     }

//     // update user
//     user.bonusAmount = (user.bonusAmount || 0) + depositBonusAmount;

//     user.activePlans = user.activePlans || [];

//     user.activePlans.push({
//       planId: packageId,
//       name,
//       amount,
//       investmentId: newInvestment[0]._id,
//       date: new Date(),
//     });

//     user.investments.push(newInvestment[0]._id);

//     user.totalInvestment = (user.totalInvestment || 0) + amount;

//     if (depositBonusAmount > 0) {
//       user.totalInvestment += depositBonusAmount;
//     }

//     user.isVerified = true;
//     user.status = true;
//     user.activeDate = new Date();

//     await user.save({ session });

//     // sponsor team update
//     if (isFirstInvestment && user.sponserId) {
//       let currentSponsorId = user.sponserId;
//       let level = 1;

//       const visited = new Set();

//       while (
//         currentSponsorId &&
//         level <= 10 &&
//         !visited.has(currentSponsorId.toString())
//       ) {
//         visited.add(currentSponsorId.toString());

//         await UserModel.updateOne(
//           { _id: currentSponsorId },
//           {
//             $inc: {
//               validTotalTeam: 1,
//               [`validLevelWiseTeam.${level}`]: 1,
//             },
//           },
//           { session },
//         );

//         const sponsor =
//           await UserModel.findById(currentSponsorId).session(session);

//         currentSponsorId = sponsor?.sponserId;
//         level++;
//       }
//     }

//     // update upline business
//     if (user.sponserId) {
//       await updateUplineBusiness(user.sponserId, amount, session);
//     }

//     // commit transaction
//     await session.commitTransaction();
//     await distributeLevelIncomeOnRoi(user, amount, newInvestment[0]._id);

//     return res.status(201).json({
//       success: true,
//       message: "Package Purchased Successfully",
//       investment: newInvestment[0],
//       activePlans: user.activePlans,
//       depositBonus: depositBonusAmount,
//     });
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }

//     console.error("Investment Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Server error",
//     });
//   } finally {
//     session.endSession();
//   }
// };

const updateUplineBusiness = async (sponserId, amount, session) => {
  let currentUserId = sponserId;

  while (currentUserId) {
    const updatedUser = await UserModel.findByIdAndUpdate(
      currentUserId,
      { $inc: { totalBusiness: amount } },
      { new: true, session }, // 👈 session pass
    );

    if (!updatedUser) break;

    currentUserId = updatedUser.sponserId;
  }
};
export const investment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { packageId, txHash } = req.body;

    if (!packageId || !txHash) {
      throw new Error("packageId and txHash are required");
    }

    const userId = req.user._id;

    // duplicate tx check
    const existingTx = await Investment.findOne({ txHash }).session(session);
    if (existingTx) {
      throw new Error("Transaction already used");
    }

    // plan
    const plan = await Package.findById(packageId).session(session);
    if (!plan) {
      throw new Error("Invalid plan selected");
    }

    const amount = plan.price;
    const dailyROI = plan.dailyROI;
    const name = plan.name;

    // user
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    const isFirstInvestment = !user.isVerified;

    // bonus calc
    let depositBonusPercent = 0;

    if (amount >= 1000) depositBonusPercent = 1;
    else if (amount >= 500) depositBonusPercent = 2;
    else if (amount >= 250) depositBonusPercent = 4;
    else if (amount >= 100) depositBonusPercent = 6;
    else if (amount >= 50) depositBonusPercent = 8;
    else if (amount >= 25) depositBonusPercent = 10;

    const depositBonusAmount = (amount * depositBonusPercent) / 100;

    // create investment
    const newInvestment = await Investment.create(
      [
        {
          userId,
          packageId,
          investmentAmount: amount,
          usdtAmount: amount,
          dailyROI,
          txHash,
          addedBy: "user",
          activeInvestment: amount,
          totalRoiEarned: 0,
          dayCount: 0,
          status: "active",
          name,
          nextRoi: amount * (dailyROI / 100),
          investmentDate: new Date(),
        },
      ],
      { session },
    );

    // bonus
    if (depositBonusAmount > 0) {
      await Bonus.create(
        [
          {
            userId,
            bonus: depositBonusAmount,
            baseAmount: amount,
            percent: depositBonusPercent,
          },
        ],
        { session },
      );
    }

    // update user
    user.bonusAmount = (user.bonusAmount || 0) + depositBonusAmount;

    user.activePlans = user.activePlans || [];

    user.activePlans.push({
      planId: packageId,
      name,
      amount,
      investmentId: newInvestment[0]._id,
      date: new Date(),
    });

    user.investments.push(newInvestment[0]._id);

    user.totalInvestment = (user.totalInvestment || 0) + amount;

    user.isVerified = true;
    user.status = true;
    user.activeDate = new Date();

    await user.save({ session });

    // sponsor team update
    if (isFirstInvestment && user.sponserId) {
      let currentSponsorId = user.sponserId;
      let level = 1;

      const visited = new Set();

      while (
        currentSponsorId &&
        level <= 10 &&
        !visited.has(currentSponsorId.toString())
      ) {
        visited.add(currentSponsorId.toString());

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

        const sponsor = await UserModel.findById(currentSponsorId)
          .select("sponserId")
          .session(session);

        currentSponsorId = sponsor?.sponserId;

        level++;
      }
    }

    // upline business update
    if (user.sponserId) {
      await updateUplineBusiness(user.sponserId, amount, session);
    }

    // commit transaction
    await session.commitTransaction();

    session.endSession();

    distributeLevelIncomeOnRoi(user, amount, newInvestment[0]._id).catch(
      (err) => {
        console.error("Level income error:", err);
      },
    );

    return res.status(201).json({
      success: true,
      message: "Package Purchased Successfully",
      investment: newInvestment[0],
      activePlans: user.activePlans,
      depositBonus: depositBonusAmount,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("Investment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
export const getTotalRoi = async (req, res) => {
  try {
    const userId = req.user._id;
    const rois = await Aroi.find({ userId });
    const totalRoi = rois.reduce((acc, item) => acc + item.roiAmount, 0);
    res.status(200).json({ success: true, totalRoi });
  } catch (error) {
    console.error("Error in getTotalRoi:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id;
    const userProfile = await UserModel.findById(userId)
      .populate("referredUsers")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: userProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getBinaryTree = async (req, res) => {
  try {
    const User = req.user;
    const userId = User._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const tree = await buildTree(user._id);

    res.json({ success: true, tree });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getDowunlineUsers = async (req, res) => {
  try {
    const User = req.user;
    const userId = User._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const downline = await getBinaryDownline(user._id);

    res.json({ success: true, downline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllPlan = async (req, res) => {
  try {
    const plans = await Plan.find({});
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const helpAndSupport = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { message, subject } = req.body;
    if (!message || !subject) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const support = await Support.create({
      userId,
      message,
      subject,
      createdAt: new Date(),
    });
    await support.save();
    res
      .status(201)
      .json({ success: true, message: "Support request sent Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getAllHelpAndSupportHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const supportHistory = await Support.find({ userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: supportHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getreferalHistoryByID = async (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const referalHistory = await ReferalBonus.find({ userId })
      .populate([
        { path: "userId", select: "username" }, // only username
        { path: "fromUser", select: "username" }, // optional: if you want only username here too
        { path: "investmentId" }, // full population for investmentId
      ])
      .sort({ createdAt: -1 });

    if (!referalHistory || referalHistory.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No referral history found for this user.",
      });
    }

    res.json({ success: true, data: referalHistory });
  } catch (error) {
    console.error("Error fetching referral history:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getInvestmentHistoryById = async (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const investmentsHistory = await Investment.find({
      userId: userId,
    })
      .populate("userId", "username walletAddress")
      .sort({ createdAt: -1 });

    if (!investmentsHistory || investmentsHistory.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No investment history found for this user.",
      });
    }

    res.json({ success: true, data: investmentsHistory });
  } catch (error) {
    console.error("Error getting investment history:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
export const getRoiIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);

    if (!userId) {
      return res.status(400).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const getRois = await Aroi.find({ userId })
      .populate("userId", "username")
      .populate("investmentId")
      .sort({ createdAt: -1 });

    if (!getRois || getRois.length === 0) {
      return res.status(200).json({
        message: "No Roi history found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Roi History Fetched",
      success: true,
      data: getRois,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const getLevelIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const levelIncomesReport = await LevelIncome.find({ userId })
      .populate("fromUserId", "username")
      .sort({ createdAt: -1 })
      .lean();

    if (levelIncomesReport.length === 0) {
      return res.status(200).json({
        message: "No Level Income History Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Level Income History Reports",
      data: levelIncomesReport,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const getUsersCountByLevel = async (req, res) => {
  try {
    const userId = req.user._id;

    let levelCounts = [];
    let currentLevelUsers = [userId];
    const visited = new Set();

    for (let level = 1; level <= 5; level++) {
      const users = await UserModel.find(
        { _id: { $in: currentLevelUsers } },
        { referredUsers: 1 },
      );

      let nextLevelUserIds = [];

      users.forEach((user) => {
        if (user.referredUsers && user.referredUsers.length > 0) {
          user.referredUsers.forEach((refId) => {
            const idStr = refId.toString();
            if (!visited.has(idStr)) {
              visited.add(idStr);
              nextLevelUserIds.push(refId);
            }
          });
        }
      });

      const nextLevelUsers = await UserModel.find(
        { _id: { $in: nextLevelUserIds } },
        {
          username: 1,
          referralCode: 1,
          walletAddress: 1,
          totalInvestment: 1,
        },
      );

      levelCounts.push({
        level,
        count: nextLevelUsers.length,
        users: nextLevelUsers,
      });

      currentLevelUsers = nextLevelUserIds;
    }

    res.status(200).json({
      success: true,
      data: levelCounts,
    });
  } catch (error) {
    console.error("Error in getUsersCountByLevel:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const withdrawalHistory = async (req, res) => {
  try {
    const userId = req.user;
    const allWithdrwal = await Withdrawal.find({ userId: userId })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();
    if (!allWithdrwal) {
      return res.status(200).json({
        message: "No withdrwal History Found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Withdrwal History Fetched",
      success: false,
      data: allWithdrwal,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const getAllTeamRewardsHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "User is not authorized",
      });
    }
    const teamRewardsHistory = await OneTimeReward.find({ userId })
      .lean()
      .populate("userId", "username")
      .select("amount creditedOn milestone")
      .exec();

    if (teamRewardsHistory.length === 0) {
      return res.status(200).json({
        message: "No Rewards History found",
        success: true,
        data: [],
      });
    }

    return res.status(200).json({
      message: "Rewards history fetched successfully",
      success: true,
      data: teamRewardsHistory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Getting Team Rewards History",
      success: false,
    });
  }
};
export const getAllMonthlyRewardsHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "User is not authorized",
      });
    }

    const history = await MonthlyRewards.find({ userId, status: "credited" })
      .populate("userId", "username")
      .lean();

    if (history.length === 0) {
      return res.status(200).json({
        message: "No Monthly Rewards History found",
        success: true,
        data: [],
      });
    }

    return res.status(200).json({
      message: "Monthly Rewards History fetched",
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in getting Monthly Rewards History",
      success: false,
    });
  }
};
export const claimRoi = async (req, res) => {
  try {
    const userId = req.user._id;
    const User = await UserModel.findById(userId);

    if (!User) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    if (User.totalInvestment === 0) {
      return res.status(200).json({
        message: "You have no investment and cannot claim ROI",
        success: false,
      });
    }
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const roiEntry = await Aroi.findOne({
      userId,
      creditedOn: { $gte: todayStart, $lt: tomorrowStart },
      isClaimed: false,
    });

    if (!roiEntry) {
      return res
        .status(200)
        .json({ message: "ROI already claimed or not available for today." });
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.dailyRoi = (user.dailyRoi || 0) + roiEntry.roiAmount;
    user.totalRoi = (user.totalRoi || 0) + roiEntry.roiAmount;
    user.totalEarnings = (user.totalEarnings || 0) + roiEntry.roiAmount;
    user.currentEarnings = (user.currentEarnings || 0) + roiEntry.roiAmount;

    await user.save();

    roiEntry.isClaimed = true;
    await roiEntry.save();

    res.status(200).json({
      message: "Today's Trade Profit is claimed successfully.",
      roiAmount: roiEntry.roiAmount,
      success: true,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Please try after sometime", success: false });
  }
};

export const getTeamBusiness = async (req, res) => {
  try {
    const userId = req.user._id;

    const levels = {
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      level5: [],
    };

    const levelBusiness = {
      level1Business: 0,
      level2Business: 0,
      level3Business: 0,
      level4Business: 0,
      level5Business: 0,
    };

    const teamBusinessPerLevel = [];
    let totalTeamBusiness = 0;

    let currentLevelUserIds = [userId];

    for (let level = 1; level <= 5; level++) {
      const users = await UserModel.find({
        sponserId: { $in: currentLevelUserIds },
      })
        .select("_id username email totalInvestment sponserId")
        .populate({
          path: "sponserId",
          select: "username",
        })
        .lean();

      if (users.length === 0) break;

      // ✅ Format each user with sponsor username
      const formattedUsers = users.map((user) => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        totalInvestment: user.totalInvestment || 0,
        sponsorUsername: user.sponserId?.username || "N/A",
      }));

      levels[`level${level}`] = formattedUsers;

      const levelBusinessAmount = formattedUsers.reduce(
        (acc, user) => acc + (user.totalInvestment || 0),
        0,
      );
      levelBusiness[`level${level}Business`] = levelBusinessAmount;

      teamBusinessPerLevel.push({
        level: `Level ${level}`,
        business: levelBusinessAmount,
        userCount: formattedUsers.length,
      });

      totalTeamBusiness += levelBusinessAmount;

      currentLevelUserIds = users.map((u) => u._id);
    }

    return res.status(200).json({
      success: true,
      message: "Team business fetched successfully",
      ...levels,
      ...levelBusiness,
      teamBusinessPerLevel,
      totalTeamBusiness,
    });
  } catch (error) {
    console.error("Error in getTeamBusiness:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const getAllPackagesForClient = async (req, res) => {
  try {
    const packages = await Package.find().lean();
    return res.status(200).json({
      success: true,
      message: "Packages fetched successfully",
      data: packages,
    });
  } catch (error) {
    console.error("Error in getAllPackages:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getDirectActiveTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const directActiveTeam = await UserModel.countDocuments({
      sponserId: userId,
      isVerified: true,
      totalInvestment: { $gte: 100 },
    })
      .select("_id username email")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Direct active team fetched successfully",
      data: directActiveTeam,
    });
  } catch (error) {
    console.error("Error in getDirectActiveTeam:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getCarFundingIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const carFundingIncomeHistory = await OneTimeReward.find({ userId })
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

export const addWalletAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { walletAddress } = req.body;
    const user = await UserModel.findById(userId);
    user.walletAddress = walletAddress;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Wallet address added successfully",
    });
  } catch (error) {
    console.error("Error in addWalletAddress:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllBonus = async (req, res) => {
  try {
    const bonuses = await Bonus.find({ userId: req.user._id })
      .populate("userId", "username")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Bonuses fetched successfully",
      data: bonuses,
    });
  } catch (error) {
    console.error("Error in getAllBonuses:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getUserTeam25Levels = async (req, res) => {
  try {
    const userId = req.user._id;

    const data = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $graphLookup: {
          from: "usermodels",
          startWith: "$referredUsers",
          connectFromField: "referredUsers",
          connectToField: "_id",
          as: "team",
          depthField: "level",
          maxDepth: 3,
        },
      },
      {
        $project: {
          team: 1,
        },
      },
    ]);

    if (!data.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const team = data[0].team;

    // 🔥 STEP 1: Map for quick lookup
    const userMap = new Map();
    team.forEach((u) => {
      userMap.set(u._id.toString(), u);
    });

    // 🔥 STEP 2: Initialize extra fields
    team.forEach((u) => {
      u.teamCount = 0;
      u.validTeamCount = 0;
    });

    // 🔥 STEP 3: Reverse traversal for team count (bottom-up)
    const sortedDesc = [...team].sort((a, b) => b.level - a.level);

    sortedDesc.forEach((user) => {
      if (user.referredUsers && user.referredUsers.length > 0) {
        user.referredUsers.forEach((childId) => {
          const child = userMap.get(childId.toString());
          if (child) {
            user.teamCount += 1 + child.teamCount;
            user.validTeamCount +=
              (child.isVerified ? 1 : 0) + child.validTeamCount;
          }
        });
      }
    });

    // 🔥 STEP 4: Level-wise grouping + business calc
    const levelMap = {};

    team.forEach((user) => {
      const level = user.level + 1;

      if (!levelMap[level]) {
        levelMap[level] = {
          users: [],
          totalBusiness: 0,
          totalUsers: 0,
          totalVerified: 0,
        };
      }

      const userBusiness =
        (user.totalBusiness || 0) + (user.totalInvestment || 0);

      levelMap[level].users.push({
        _id: user._id,
        username: user.username,
        totalInvestment: user.totalInvestment,
        totalBusiness: user.totalBusiness,
        isVerified: user.isVerified,
        rank: user.rank,
        totalEarnings: user.totalEarnings,
        createdAt: user.createdAt,
        teamCount: user.teamCount,
        validTeamCount: user.validTeamCount,
        business: userBusiness,
      });

      levelMap[level].totalBusiness += userBusiness;
      levelMap[level].totalUsers += 1;
      if (user.isVerified) levelMap[level].totalVerified += 1;
    });

    // 🔥 STEP 5: Final result
    const result = Object.keys(levelMap)
      .sort((a, b) => a - b)
      .map((lvl) => ({
        level: Number(lvl),
        totalUsers: levelMap[lvl].totalUsers,
        totalVerified: levelMap[lvl].totalVerified,
        totalBusiness: levelMap[lvl].totalBusiness,
        users: levelMap[lvl].users,
      }));

    res.status(200).json({
      success: true,
      totalLevels: result.length,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getStakeIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const stakeIncomeHistory = await StakingIncome.find({ userId })
      .sort({
        createdAt: -1,
      })
      .lean();
    res.json({
      success: true,
      data: stakeIncomeHistory,
      message: "Stake Income History",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const stakeDepositHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const stakeDepositHistory = await Stake.find({ userId })
      .sort({
        createdAt: -1,
      })
      .lean();
    res.json({
      success: true,
      data: stakeDepositHistory,
      message: "Stake Deposit History",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const withdrawalHistory = await Withdrawal.find({ userId })
      .sort({
        createdAt: -1,
      })
      .lean();
    res.json({
      success: true,
      data: withdrawalHistory,
      message: "Withdrawal History",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
