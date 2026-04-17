import mongoose from "mongoose";
import OneTimeReward from "../models/oneTime.model.js";
import UserModel from "../models/user.model.js";

const BATCH_SIZE = 200;

const LEVEL_REWARDS = [
  { rank: "Q1", required: 3, reward: 5, maxLevel: 1 },
  { rank: "Q2", required: 15, reward: 15, maxLevel: 3 },
  { rank: "Q3", required: 35, reward: 35, maxLevel: 3 },
  { rank: "Q4", required: 100, reward: 85, maxLevel: 3 },
  { rank: "Q5", required: 150, reward: 350, maxLevel: 3 },
  { rank: "Q6", required: 400, reward: 1000, maxLevel: 4 },
  { rank: "Q7", required: 1000, reward: 3500, maxLevel: 4 },
  { rank: "Q8", required: 2000, reward: 15000, maxLevel: 4 },
  { rank: "Q9", required: 6000, reward: 30000, maxLevel: 4 },
  { rank: "Q10", required: 10000, reward: 50000, maxLevel: 4 },
];

const calculateValidTeamSize = (validLevelWiseTeam, maxLevel) => {
  let total = 0;
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    total += Number(
      validLevelWiseTeam[lvl] ?? validLevelWiseTeam[lvl.toString()] ?? 0,
    );
  }
  return total;
};

export const distributeRankRewards = async () => {
  try {
    const cursor = UserModel.find({ totalInvestment: { $gte: 25 } })
      .lean()
      .cursor();

    let batch = [];

    for await (const user of cursor) {
      batch.push(user);

      if (batch.length >= BATCH_SIZE) {
        await processBatch(batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await processBatch(batch);
    }

    console.log("Rewards distributed successfully");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};
const processBatch = async (users) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userOps = [];
    const rewardOps = [];

    for (const user of users) {
      const validLevelWiseTeam = user.validLevelWiseTeam || {};

      let achievedReward = 0;
      let achievedRank = null;
      let achievedMilestone = 0;
      let achievedLevel = 0;

      for (const config of LEVEL_REWARDS) {
        const totalTeam = calculateValidTeamSize(
          validLevelWiseTeam,
          config.maxLevel,
        );

        if (
          totalTeam >= config.required &&
          config.required > achievedMilestone
        ) {
          achievedReward = config.reward;
          achievedRank = config.rank;
          achievedMilestone = config.required;
          achievedLevel = config.maxLevel;
        }
      }
      const lastMilestone = user.lastRewardMilestone || 0;
      if (achievedMilestone > lastMilestone) {
        userOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                lastRewardMilestone: achievedMilestone,
                teamRewards: achievedReward,
                rank: achievedRank,
              },
              $inc: {
                currentEarnings: achievedReward,
                totalEarnings: achievedReward,
                totalTeamRewards: achievedReward,
              },
            },
          },
        });

        // Insert OneTimeReward
        rewardOps.push({
          insertOne: {
            document: {
              userId: user._id,
              amount: achievedReward,
              milestone: achievedMilestone,
              levelAchieved: achievedLevel,
              rank: achievedRank,
              rewardTier: achievedRank,
              creditedOn: new Date(),
              status: "credited",
            },
          },
        });

        console.log(
          `[REWARD] User: ${user.username} | Rank: ${achievedRank} | Reward: $${achievedReward} | Milestone: ${achievedMilestone} | Level: ${achievedLevel}`,
        );
      } else {
        console.log(
          `[NO REWARD] User: ${user.username} | Last Milestone: ${lastMilestone} | Achieved: ${achievedMilestone} | TotalTeam: ${JSON.stringify(validLevelWiseTeam)}`,
        );
      }
    }

    if (userOps.length) await UserModel.bulkWrite(userOps, { session });
    if (rewardOps.length) await OneTimeReward.bulkWrite(rewardOps, { session });

    await session.commitTransaction();
  } catch (error) {
    console.error("❌ Batch error:", error.message);
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
};
