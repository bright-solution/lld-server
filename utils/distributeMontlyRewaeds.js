import mongoose from "mongoose";
import UserModel from "../models/user.model.js";
import MonthlyRewards from "../models/monthlyRewards.js";

const LEVEL_REWARDS = [
  {
    rank: "Q3",
    required: 5,
    salary: 50,
    designation: "Supervisor",
    maxLevel: 2,
  },
  {
    rank: "Q4",
    required: 20,
    salary: 180,
    designation: "Executive",
    maxLevel: 3,
  },
  {
    rank: "Q5",
    required: 50,
    salary: 350,
    designation: "Assistant Manager",
    maxLevel: 4,
  },
  {
    rank: "Q6",
    required: 400,
    salary: 10000,
    designation: "Regional Head",
    maxLevel: 4,
  },
  {
    rank: "Q7",
    required: 1000,
    salary: 2500,
    designation: "Assistant General Manager",
    maxLevel: 4,
  },
  {
    rank: "Q8",
    required: 2000,
    salary: 5000,
    designation: "General Manager",
    maxLevel: 4,
  },
  {
    rank: "Q9",
    required: 6000,
    salary: 10000,
    designation: "Assistant Vice President",
    maxLevel: 4,
  },
  {
    rank: "Q10",
    required: 10000,
    salary: 25000,
    designation: "President",
    maxLevel: 4,
  },
];

// Count team members up to maxLevel
const countTeamByLevel = async (userId, maxLevel = 10) => {
  let totalCount = 0;
  let currentLevelUsers = [userId];
  let level = 0;

  while (currentLevelUsers.length > 0 && level < maxLevel) {
    level++;
    const users = await UserModel.find({
      sponserId: { $in: currentLevelUsers },
      isVerified: true,
      totalInvestment: { $gte: 25 },
    }).select("_id");

    const nextLevelUsers = users.map((u) => u._id);
    totalCount += nextLevelUsers.length;
    currentLevelUsers = nextLevelUsers;
  }
  return totalCount;
};

export const createMonthlyRankHistory = async () => {
  try {
    const cursor = UserModel.find({ totalInvestment: { $gte: 25 } }).cursor();
    const now = new Date();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const existing = await MonthlyRewards.findOne({
      userId: user._id,
      rank: achievedRank,
      creditedOn: { $gte: monthStart, $lt: monthEnd },
    });

    for await (const user of cursor) {
      const teamSize = await countTeamByLevel(user._id, 4);

      let achievedRank = null;
      let achievedSalary = 0;
      let designation = "";
      let levelAchieved = 0;

      for (const config of LEVEL_REWARDS) {
        if (teamSize >= config.required) {
          achievedRank = config.rank;
          achievedSalary = config.salary;
          designation = config.designation;
          levelAchieved = Math.min(4, Math.floor(teamSize / config.required));
        }
      }

      if (!achievedRank) continue;

      const existing = await MonthlyRewards.findOne({
        userId: user._id,
        rank: achievedRank,
        creditedOn: { $gte: monthStart, $lt: monthEnd },
      });

      if (existing) continue;

      await MonthlyRewards.create({
        userId: user._id,
        rank: achievedRank,
        designation,
        salary: achievedSalary,
        rewardTier: achievedRank,
        amount: 0, // pending
        milestone: teamSize,
        levelAchieved,
        creditedOn: now,
        status: "pending",
      });

      console.log(
        `🕒 ${user.username} | Rank: ${achievedRank} | Designation: ${designation} | Team: ${teamSize} | Pending Salary: $${achievedSalary} | Level: ${levelAchieved}`,
      );
    }

    console.log("🎉 Monthly rank history created (no duplicates)");
  } catch (err) {
    console.error("❌ Error creating monthly rank history:", err.message);
  }
};
