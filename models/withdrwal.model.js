import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    userWalletAddress: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },

    network: {
      type: String,
      enum: ["ethereum", "binance", "polygon"],
      default: "ethereum",
    },
    token: {
      type: String,
      enum: ["LLD", "USDT", "BUSD"],
      default: "LLD",
    },

    transactionHash: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      required: true,
    },
    approvedDate: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;
