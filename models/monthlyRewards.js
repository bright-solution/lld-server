import mongoose from "mongoose";

const monthlyRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    rank: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    salary: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0, // future payout, abhi pending
    },
    creditedOn: {
      type: Date,
      default: Date.now,
    },
    milestone: {
      type: Number,
      default: 0,
    },
    levelAchieved: {
      type: Number,
      default: 0,
    },
    totalBusiness: {
      type: Number,
      default: 0,
    },
    rewardTier: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "credited"],
      default: "pending",
    },
    creditedOn: {
      type: Date,
    },
  },
  { timestamps: true },
);

const MonthlyRewards = mongoose.model("MonthlyRewards", monthlyRewardSchema);
export default MonthlyRewards;
