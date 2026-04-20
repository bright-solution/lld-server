import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    totalBusiness: { type: Number, default: 0 },

    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true, // 🔥 important
    },

    rank: String,
    fundingIncome: { type: Number, default: 0 },

    name: String,

    username: {
      type: String,
      unique: true,
      sparse: true,
    },

    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    isVerified: { type: Boolean, default: false },
    status: { type: Boolean, default: false },
    isLoginBlocked: { type: Boolean, default: false },
    monthlySalary: {
      type: Number,
      default: 0,
    },
    totalMonthlySalary: {
      type: Number,
      default: 0,
    },
    bonusAmount: {
      type: Number,
      default: 0,
    },
    sponserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
      index: true,
    },

    parentId: {
      // 🔥 ADD THIS (important)
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
      index: true,
    },

    parentReferedCode: {
      type: String,
      default: null,
    },

    left: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    right: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    position: {
      type: String,
      enum: ["left", "right", null],
      default: null,
    },

    hasEmptySlot: {
      type: Boolean,
      default: true,
      index: true,
    },

    referredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    investments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Investment",
      },
    ],
    uplineWallets: {
      type: [String],
      default: [],
    },
    totalInvestment: { type: Number, default: 0 },
    activeDate: { type: Date, default: null },

    totalEarnings: { type: Number, default: 0 },
    currentEarnings: { type: Number, default: 0 },
    totalPayouts: { type: Number, default: 0 },
    role: { type: String, default: "user" },

    // 📈 ROI
    dailyRoi: { type: Number, default: 0 },
    totalRoi: { type: Number, default: 0 },
    currentTokens: { type: Number, default: 0 },

    levelIncome: { type: Number, default: 0 },
    directReferalAmount: { type: Number, default: 0 },

    canWithdraw: { type: Boolean, default: false },
    withdrawalCount: { type: Number, default: 0 },
    lastWithdrawalDate: Date,

    levelWiseTeam: {
      type: Map,
      of: Number,
      default: {},
    },

    totalTeam: {
      type: Number,
      default: 0,
    },

    validLevelWiseTeam: {
      type: Map,
      of: Number,
      default: {},
    },

    validTotalTeam: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("UserModel", userSchema);

export default UserModel;
