import mongoose from "mongoose";

const stakingIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    investmentAmount: { type: Number, required: true },
    roiPercent: { type: Number, default: 3 },
    dailyPercent: { type: Number, default: 0.1 },
    incomeAmount: { type: Number, required: true },
    creditedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const StakingIncome = mongoose.model("StakingIncome", stakingIncomeSchema);

export default StakingIncome;
