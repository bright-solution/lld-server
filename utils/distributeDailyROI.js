import StakingIncome from "../models/Stakingincome.model.js";
import UserModel from "../models/user.model.js";

export const distributeDailyROI = async () => {
  const now = new Date();
  console.log(`\n[CRON] ROI start — ${now.toISOString()}`);

  const users = await UserModel.find({ totalInvestment: { $gt: 0 } });

  if (!users.length) {
    console.log("[CRON] Koi eligible user nahi.\n");
    return;
  }

  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const dailyIncome = parseFloat(
        ((user.totalInvestment * 3) / 100 / 30).toFixed(8),
      );

      await UserModel.findByIdAndUpdate(user._id, {
        $inc: {
          totalRoi: dailyIncome,
          totalEarnings: dailyIncome,
          currentEarnings: dailyIncome,
        },
        set: { dailyRoi: dailyIncome },
      });
      await StakingIncome.create({
        userId: user._id,
        investmentAmount: user.totalInvestment,
        roiPercent: 3,
        dailyPercent: 0.1,
        incomeAmount: dailyIncome,
        creditedAt: now,
      });

      console.log(
        `  ✓ ${user._id} | investment: ${user.totalInvestment} | +${dailyIncome} LLD`,
      );
      success++;
    } catch (err) {
      console.error(`  ✗ ${user._id} — ${err.message}`);
      failed++;
    }
  }

  console.log(`[CRON] Done — Success: ${success} | Failed: ${failed}\n`);
};
