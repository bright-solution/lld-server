import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    activeInvestment: {
      type: Number,
      default: 0,
    },
    usdtAmount: {
      type: Number,
      default: 0,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    roiDaysGiven: {
      type: Number,
      default: 0,
    },
    totalRoiEarned: {
      type: Number,
      default: 0,
    },
    dailyROI: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    addedBy: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    investmentAmount: {
      type: Number,
      required: true,
    },
    investmentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;
