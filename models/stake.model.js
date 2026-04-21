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
      index: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"],
    },

    txHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"],
    },

    stakedAmount: {
      type: Number,
      required: true,
      min: [0.0001, "Stake amount too low"],
    },

    lockPeriodDays: {
      type: Number,
      required: true,
      min: [1, "Lock period too short"],
      max: [3650, "Lock period too long"],
      default: 365,
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    unlockDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    isLocked: {
      type: Boolean,
      required: true,
      default: true,
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

// Compound indexes for common queries
stakeSchema.index({ userId: 1, status: 1 });
stakeSchema.index({ endDate: 1, isLocked: 1 }); // cron job ke liye

const Stake = mongoose.model("Stake", stakeSchema);

export default Stake;
