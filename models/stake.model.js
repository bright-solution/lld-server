import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },

    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    txHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    stakedAmount: {
      type: Number,
      required: true,
      min: [0.0001, "Stake amount too low"],
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

const Stake = mongoose.model("Stake", stakeSchema);

export default Stake;
