import mongoose from "mongoose";

const bonusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    baseAmount: {
      type: Number,
      default: 0,
    },
    percent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Bonus = mongoose.model("Bonus", bonusSchema);

export default Bonus;
