// import cron from "node-cron";
// import { createMonthlyRankHistory } from "./distributeMontlyRewaeds.js";
// import { distributeRankRewards } from "./distributeRankRewards.js";
// import { distributeDailyROI } from "./distributeDailyROI.js";
// import MonthlyRewards from "../models/monthlyRewards.js";
// import UserModel from "../models/user.model.js";
// let isDistributeRoi = false;
// let isMonthlyRewardProcessing = false;
// let isRankRewardProcessing = false;
// // ==============================
// // 🟢 DAILY ROI (12:00 AM)
// // ==============================

// cron.schedule("0 0 * * *", async () => {
//   console.log("⏰ Daily ROI Cron Started");
//   if (isDistributeRoi) {
//     console.log("⚠️ Daily ROI already running...");
//     return;
//   }
//   isDistributeRoi = true;
//   try {
//     await distributeDailyROI();
//   } catch (err) {
//     console.error("❌ ROI Cron Error:", err);
//   } finally {
//     isDistributeRoi = false;
//   }

//   console.log("✅ Daily ROI Cron Finished");
// });

// //iffe
// // (async () => {
// //   await distributeDailyROI();
// // })();

// // ==============================
// // 🟡 MONTHLY SALARY (12:10 AM)
// // ==============================
// cron.schedule("0 10 * * *", async () => {
//   if (isMonthlyRewardProcessing) {
//     console.log("⚠️ Monthly rewards already running...");
//     return;
//   }

//   isMonthlyRewardProcessing = true;

//   try {
//     await createMonthlyRankHistory();
//     console.log("✅ Monthly rewards completed");
//   } catch (err) {
//     console.error("❌ Monthly reward error:", err);
//   } finally {
//     isMonthlyRewardProcessing = false;
//   }
// });

// // ==============================
// // 🔵 Rank & Reward INCOME (12:20 AM)
// // ==============================
// cron.schedule("0 0 * * *", async () => {
//   if (isRankRewardProcessing) {
//     console.log("⚠️ Rank rewards already running...");
//     return;
//   }
//   isRankRewardProcessing = true;
//   try {
//     await distributeRankRewards();
//     console.log("✅ Rank rewards completed");
//   } catch (err) {
//     console.error("❌ Rank rewards error:", err);
//   } finally {
//     isRankRewardProcessing = false;
//   }
// });

// cron.schedule("0 0 1 * *", async () => {
//   console.log("⏰ Monthly salary distribution started");

//   try {
//     const pendingRewards = await MonthlyRewards.find({ status: "pending" });
//     for (const reward of pendingRewards) {
//       await UserModel.updateOne(
//         { _id: reward.userId },
//         {
//           $inc: {
//             monthlySalary: reward.salary,
//             totalMonthlySalary: reward.salary,
//             totalEarnings: reward.salary,
//             currentEarnings: reward.salary,
//           },
//         },
//       );
//       reward.status = "credited";
//       reward.creditedOn = new Date();
//       await reward.save();
//       console.log(
//         `✅ Credited $${reward.salary} to ${reward.userId} for ${reward.rank}`,
//       );
//     }
//     console.log(" All pending salaries credited!");
//   } catch (err) {
//     console.error("❌ Error crediting monthly salaries:", err.message);
//   }
//   console.log("✅ Monthly salary distribution finished");
// });
