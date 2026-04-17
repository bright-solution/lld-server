// import mongoose from "mongoose";
// import Investment from "../models/investment.model.js";
// import Package from "../models/Package.model.js";
// import Aroi from "../models/roi.model.js";
// import UserModel from "../models/user.model.js";

// export const distributeDailyROI = async () => {
//   try {
//     console.log("⏰ Daily ROI Cron Started");

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const investments = await Investment.find({
//       status: "active",
//       investmentAmount: { $gt: 0 },
//     }).lean();

//     if (!investments.length) {
//       console.log("No active investments");
//       return;
//     }

//     // ✅ Packages load
//     const packages = await Package.find({}).lean();

//     // 🔥 Map by price (temporary approach)
//     const packageMap = {};
//     for (const p of packages) {
//       packageMap[p.price] = p;
//     }

//     const investmentBulk = [];
//     const roiHistoryBulk = [];
//     const userMap = {};

//     // 🔁 LOOP START
//     for (const inv of investments) {
//       const pkg = packageMap[inv.investmentAmount];
//       if (!pkg) continue;

//       // 🛑 STOP: duration complete
//       if ((inv.roiDaysGiven || 0) >= pkg.duration) {
//         investmentBulk.push({
//           updateOne: {
//             filter: { _id: inv._id },
//             update: { $set: { status: "completed" } },
//           },
//         });
//         continue;
//       }

//       if (!pkg.dailyROI || pkg.dailyROI <= 0) continue;
//       const roi = (inv.investmentAmount * pkg.dailyROI) / 100;

//       // 📈 Investment update
//       investmentBulk.push({
//         updateOne: {
//           filter: { _id: inv._id },
//           update: {
//             $inc: {
//               totalRoiEarned: roi,
//               roiDaysGiven: 1, // 🔥 COUNT INCREMENT
//             },
//           },
//         },
//       });

//       // 🧾 ROI history
//       roiHistoryBulk.push({
//         insertOne: {
//           document: {
//             userId: inv.userId,
//             investmentId: inv._id,
//             planName: pkg.name,
//             investmentAmount: inv.investmentAmount,
//             roiAmount: roi,
//             percentage: pkg.dailyROI,
//             creditedOn: today,
//             isClaimed: false,
//           },
//         },
//       });

//       // 👤 User aggregation
//       if (!userMap[inv.userId]) userMap[inv.userId] = 0;
//       userMap[inv.userId] += roi;
//     }

//     // 👤 USER UPDATE
//     const userBulk = Object.keys(userMap).map((userId) => ({
//       updateOne: {
//         filter: { _id: userId },
//         update: {
//           $set: { dailyRoi: userMap[userId] },
//           $inc: {
//             totalRoi: userMap[userId],
//             totalEarnings: userMap[userId],
//             currentEarnings: userMap[userId],
//             mainWallet: userMap[userId],
//           },
//         },
//       },
//     }));

//     const session = await mongoose.startSession();
//     try {
//       await session.withTransaction(async () => {
//         if (investmentBulk.length)
//           await Investment.bulkWrite(investmentBulk, { session });
//         if (roiHistoryBulk.length)
//           await Aroi.bulkWrite(roiHistoryBulk, { session });
//         if (userBulk.length) await UserModel.bulkWrite(userBulk, { session });
//       });
//     } finally {
//       await session.endSession();
//     }

//     console.log("✅ ROI Distributed Successfully & Stopped on Time");
//   } catch (err) {
//     console.error("❌ ROI Error:", err);
//   }
// };

// import mongoose from "mongoose";
// import Investment from "../models/investment.model.js";
// import Package from "../models/Package.model.js";
// import Aroi from "../models/roi.model.js";
// import UserModel from "../models/user.model.js";
// import dotenv from "dotenv";
// import { ethers } from "ethers";
// import InvestmentABI from "../config/abi.js";

// // =========================
// // BLOCKCHAIN SETUP
// // =========================
// const provider = new ethers.JsonRpcProvider(process.env.BSC_PRC);

// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// const contract = new ethers.Contract(
//   process.env.CONTRACT_ADDRESS,
//   InvestmentABI,
//   wallet,
// );

// // =========================
// // MAIN CRON
// // =========================
// export const distributeDailyROI = async () => {
//   try {
//     console.log("⏰ Daily ROI Cron Started");

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const investments = await Investment.find({
//       status: "active",
//       investmentAmount: { $gt: 0 },
//     }).lean();

//     if (!investments.length) {
//       console.log("No active investments");
//       return;
//     }

//     const packages = await Package.find({}).lean();

//     const packageMap = {};
//     for (const p of packages) {
//       packageMap[p.price] = p;
//     }

//     const investmentBulk = [];
//     const roiHistoryBulk = [];
//     const userMap = {};

//     // =========================
//     // ROI CALCULATION (DB PART)
//     // =========================
//     for (const inv of investments) {
//       const pkg = packageMap[inv.investmentAmount];
//       if (!pkg) continue;

//       if ((inv.roiDaysGiven || 0) >= pkg.duration) {
//         investmentBulk.push({
//           updateOne: {
//             filter: { _id: inv._id },
//             update: { $set: { status: "completed" } },
//           },
//         });
//         continue;
//       }

//       const roi = (inv.investmentAmount * pkg.dailyROI) / 100;
//       if (!roi || roi <= 0) continue;

//       investmentBulk.push({
//         updateOne: {
//           filter: { _id: inv._id },
//           update: {
//             $inc: {
//               totalRoiEarned: roi,
//               roiDaysGiven: 1,
//             },
//           },
//         },
//       });

//       roiHistoryBulk.push({
//         insertOne: {
//           document: {
//             userId: inv.userId,
//             investmentId: inv._id,
//             planName: pkg.name,
//             investmentAmount: inv.investmentAmount,
//             roiAmount: roi,
//             percentage: pkg.dailyROI,
//             creditedOn: today,
//             isClaimed: false,
//           },
//         },
//       });

//       if (!userMap[inv.userId]) userMap[inv.userId] = 0;
//       userMap[inv.userId] += roi;
//     }

//     // =========================
//     // DB USER UPDATE
//     // =========================
//     const userBulk = Object.keys(userMap).map((userId) => ({
//       updateOne: {
//         filter: { _id: userId },
//         update: {
//           $set: { dailyRoi: userMap[userId] },
//           $inc: {
//             totalRoi: userMap[userId],
//             totalEarnings: userMap[userId],
//             currentEarnings: userMap[userId],
//             mainWallet: userMap[userId],
//           },
//         },
//       },
//     }));

//     // =========================
//     // EXECUTE DB TRANSACTION
//     // =========================
//     const session = await mongoose.startSession();
//     try {
//       await session.withTransaction(async () => {
//         if (investmentBulk.length)
//           await Investment.bulkWrite(investmentBulk, { session });

//         if (roiHistoryBulk.length)
//           await Aroi.bulkWrite(roiHistoryBulk, { session });

//         if (userBulk.length) await UserModel.bulkWrite(userBulk, { session });
//       });
//     } finally {
//       await session.endSession();
//     }

//     console.log("✅ DB ROI Updated Successfully");

//     // =========================
//     // BUILD ON-CHAIN DATA
//     // =========================
//     const users = [];
//     const amounts = [];

//     for (const userId of Object.keys(userMap)) {
//       const user = await UserModel.findById(userId).lean();
//       if (!user?.walletAddress) continue;

//       users.push(user.walletAddress);

//       // USDT 6 decimals
//       const amount = ethers.parseUnits(userMap[userId].toString(), 6);

//       amounts.push(amount);
//     }

//     // =========================
//     // BATCH ON-CHAIN CALL (25 USERS)
//     // =========================
//     const batchSize = 25;

//     console.log("🚀 Sending ROI to Blockchain...");

//     for (let i = 0; i < users.length; i += batchSize) {
//       const batchUsers = users.slice(i, i + batchSize);
//       const batchAmounts = amounts.slice(i, i + batchSize);

//       try {
//         const tx = await contract.creditIncomeBatch(
//           batchUsers,
//           batchAmounts,
//           1,
//           {
//             gasLimit: 3000000,
//           },
//         );

//         await tx.wait();

//         console.log(`✅ Blockchain Batch ${i / batchSize + 1} done`);
//       } catch (err) {
//         console.error("❌ Blockchain batch failed:", err);
//       }
//     }

//     console.log("🎉 ROI Distribution Completed (DB + ONCHAIN)");
//   } catch (err) {
//     console.error("❌ ROI Error:", err);
//   }
// };

import mongoose from "mongoose";
import Investment from "../models/investment.model.js";
import Package from "../models/Package.model.js";
import Aroi from "../models/roi.model.js";
import UserModel from "../models/user.model.js";
import { ethers } from "ethers";
import InvestmentABI from "../config/abi.js";

// =========================
// RPC FALLBACK SYSTEM
// =========================
const RPCS = [
  "https://bsc-dataseed.binance.org/",
  "https://rpc.ankr.com/bsc",
  "https://lb.drpc.org/bsc",
  "https://1rpc.io/bnb",
];

function getProvider() {
  for (const rpc of RPCS) {
    try {
      return new ethers.JsonRpcProvider(rpc);
    } catch (e) {}
  }
  throw new Error("No working RPC");
}

const provider = getProvider();

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  InvestmentABI,
  wallet,
);

// =========================
// RETRY FUNCTION
// =========================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function safeTx(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.log(`⚠️ Retry ${i + 1}/${retries}`);
      await sleep(3000);
    }
  }
  throw new Error("Transaction failed after retries");
}

// =========================
// MAIN CRON
// =========================
export const distributeDailyROI = async () => {
  try {
    console.log("⏰ Daily ROI Cron Started");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const investments = await Investment.find({
      status: "active",
      investmentAmount: { $gt: 0 },
    }).lean();

    if (!investments.length) {
      console.log("No active investments");
      return;
    }

    const packages = await Package.find({}).lean();

    const packageMap = {};
    for (const p of packages) {
      packageMap[p.price] = p;
    }

    const investmentBulk = [];
    const roiHistoryBulk = [];
    const userMap = {};

    // =========================
    // ROI CALCULATION (DB)
    // =========================
    for (const inv of investments) {
      const pkg = packageMap[inv.investmentAmount];
      if (!pkg) continue;

      if ((inv.roiDaysGiven || 0) >= pkg.duration) {
        investmentBulk.push({
          updateOne: {
            filter: { _id: inv._id },
            update: { $set: { status: "completed" } },
          },
        });
        continue;
      }

      const roi = (inv.investmentAmount * pkg.dailyROI) / 100;
      if (!roi) continue;

      investmentBulk.push({
        updateOne: {
          filter: { _id: inv._id },
          update: {
            $inc: {
              totalRoiEarned: roi,
              roiDaysGiven: 1,
            },
          },
        },
      });

      roiHistoryBulk.push({
        insertOne: {
          document: {
            userId: inv.userId,
            investmentId: inv._id,
            planName: pkg.name,
            investmentAmount: inv.investmentAmount,
            roiAmount: roi,
            percentage: pkg.dailyROI,
            creditedOn: today,
            isClaimed: false,
          },
        },
      });

      userMap[inv.userId] = (userMap[inv.userId] || 0) + roi;
    }

    // =========================
    // USER DB UPDATE
    // =========================
    const userBulk = Object.keys(userMap).map((userId) => ({
      updateOne: {
        filter: { _id: userId },
        update: {
          $set: { dailyRoi: userMap[userId] },
          $inc: {
            totalRoi: userMap[userId],
            totalEarnings: userMap[userId],
            currentEarnings: userMap[userId],
            mainWallet: userMap[userId],
          },
        },
      },
    }));

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (investmentBulk.length)
          await Investment.bulkWrite(investmentBulk, { session });

        if (roiHistoryBulk.length)
          await Aroi.bulkWrite(roiHistoryBulk, { session });

        if (userBulk.length) await UserModel.bulkWrite(userBulk, { session });
      });
    } finally {
      await session.endSession();
    }

    console.log("✅ DB ROI Updated Successfully");

    // =========================
    // ON-CHAIN DATA BUILD
    // =========================
    const users = [];
    const amounts = [];

    for (const userId of Object.keys(userMap)) {
      const user = await UserModel.findById(userId).lean();
      if (!user?.walletAddress) continue;

      users.push(user.walletAddress);
      amounts.push(ethers.parseUnits(userMap[userId].toString(), 18));
    }

    // =========================
    // ONCHAIN BATCH (SAFE)
    // =========================
    const batchSize = 25;

    console.log("🚀 Sending ROI to Blockchain...");

    for (let i = 0; i < users.length; i += batchSize) {
      const batchUsers = users.slice(i, i + batchSize);
      const batchAmounts = amounts.slice(i, i + batchSize);

      try {
        await safeTx(async () => {
          const tx = await contract.creditIncomeBatch(
            batchUsers,
            batchAmounts,
            1,
            {
              gasLimit: 3000000,
            },
          );

          await tx.wait();
        });

        console.log(`✅ Batch ${i / batchSize + 1} success`);
      } catch (err) {
        console.error("❌ Batch failed permanently:", err.message);
      }
    }

    console.log("🎉 ROI DONE (DB + ONCHAIN)");
  } catch (err) {
    console.error("❌ ROI ERROR:", err);
  }
};
