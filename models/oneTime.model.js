import mongoose from "mongoose";

const OneTimeRewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  rank: { type: String, required: true }, // store the rank (Q3, Q4, etc.)
  rewardTier: { type: String, required: true }, // same as rank, for clarity
  amount: { type: Number, required: true }, // reward points or amount
  salary: { type: Number, default: 0 }, // monthly salary for that rank
  milestone: { type: Number, required: true }, // total upgraded members
  levelAchieved: { type: Number, required: true }, // depth level reached
  creditedOn: { type: Date, required: true },
  status: { type: String, enum: ["pending", "credited"], default: "pending" },
});

const OneTimeReward = mongoose.model("OneTimeReward", OneTimeRewardSchema);

export default OneTimeReward;
