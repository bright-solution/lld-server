import mongoose from "mongoose";

const levelIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },

    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },

    fromUserName: {
      type: String,
      default: "",
    },

    toUserName: {
      type: String,
      default: "",
    },

    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
      index: true,
    },

    investmentAmount: {
      type: Number,
      default: 0,
    },

    roi: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    level: {
      type: Number,
      required: true,
    },

    percent: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_onchain", "credited"],
      default: "pending_onchain",
    },
    dayCount: {
      type: Number,
      default: 1,
    },

    creditedAt: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const LevelIncome = mongoose.model("LevelIncome", levelIncomeSchema);

export default LevelIncome;
