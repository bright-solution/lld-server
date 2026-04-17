import OneTimeReward from "../models/oneTime.model.js";
import UserModel from "../models/user.model.js";

export const distributeFundingIncome = async () => {
  try {
    console.log("🚀 Funding Distribution Started");

    const users = await UserModel.find({ totalBusiness: { $gte: 150000 } });
    console.log("👥 Total eligible users:", users.length);

    const fundingLevels = [
      { business: 150000, name: "Platinum" },
      { business: 500000, name: "Diamond" },
      { business: 1500000, name: "Crown" },
      { business: 5000000, name: "Royal" },
      { business: 15000000, name: "Ambassador" },
      { business: 50000000, name: "Crown Ambassador" },
      { business: 150000000, name: "Royal Ambassador" },
      { business: 300000000, name: "Brand Ambassador" },
    ];

    const userOps = [];
    const rewardOps = [];

    for (const user of users) {
      const totalBusiness = user.totalBusiness || 0;

      console.log(
        `\n👤 Checking user: ${user.username} | Business: ${totalBusiness}`,
      );

      for (const level of fundingLevels) {
        console.log(`➡️ Checking level: ${level.name} (${level.business})`);

        if (totalBusiness >= level.business) {
          console.log(`✅ Qualified for ${level.name}`);

          // 🔍 Check already given
          const alreadyGiven = await OneTimeReward.findOne({
            userId: user._id,
            rank: level.name,
          });

          if (alreadyGiven) {
            console.log(`⛔ Already received ${level.name} reward`);
            continue;
          }

          const rewardAmount = (totalBusiness * 2) / 100;

          console.log(
            `💰 Reward Calculated: ${rewardAmount} for ${level.name}`,
          );

          // USER UPDATE
          userOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: {
                $inc: {
                  currentEarnings: rewardAmount,
                  totalEarnings: rewardAmount,
                  fundingIncome: rewardAmount,
                },
              },
            },
          });

          // HISTORY INSERT
          rewardOps.push({
            insertOne: {
              document: {
                userId: user._id,
                totalBusiness,
                rank: level.name,
                percentage: 2,
                amount: rewardAmount,
                creditedOn: new Date(),
              },
            },
          });

          console.log(`🔥 Added to bulk: ${user.username} → ${level.name}`);
        } else {
          console.log(
            `❌ Not qualified for ${level.name} (needs ${level.business})`,
          );
        }
      }
    }

    console.log("\n📦 Bulk Operations:");
    console.log("UserOps:", userOps.length);
    console.log("RewardOps:", rewardOps.length);

    if (userOps.length) {
      await UserModel.bulkWrite(userOps);
      console.log("✅ User earnings updated");
    } else {
      console.log("⚠️ No user updates");
    }

    if (rewardOps.length) {
      await OneTimeReward.bulkWrite(rewardOps);
      console.log("✅ Reward history saved");
    } else {
      console.log("⚠️ No reward history to save");
    }

    console.log("🎉 Funding Distribution Completed");
  } catch (error) {
    console.error("❌ Funding Error FULL:", error);
  }
};
