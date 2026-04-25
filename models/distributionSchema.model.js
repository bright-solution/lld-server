import mongoose from "mongoose";
const distributionSchema = new mongoose.Schema(
  {
    totalLLD: { type: String, required: true }, // wei string (BigInt safe)
    userShare: { type: String, required: true }, // 85%
    ref1Share: { type: String, default: "0" }, // 5%
    ref2Share: { type: String, default: "0" }, // 3%
    ref3Share: { type: String, default: "0" }, // 2%
    adminShare: { type: String, default: "0" }, // 5%
    spentETH: { type: String, default: "0" }, // wei string
  },
  { _id: false },
);

const refsSchema = new mongoose.Schema(
  {
    ref1: { type: String, default: null }, // null = koi ref nahi tha
    ref2: { type: String, default: null },
    ref3: { type: String, default: null },
  },
  { _id: false },
);

const lldTransactionSchema = new mongoose.Schema(
  {
    // ── On-chain data ──────────────────────────────────────────
    txHash: {
      type: String,
      required: true,
      unique: true, // duplicate tx save nahi hogi
      lowercase: true,
      trim: true,
      index: true,
    },

    blockNumber: {
      type: Number,
      required: true,
    },

    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // ── User info ──────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
      index: true,
    },

    buyer: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // ── Payment info ───────────────────────────────────────────
    usdtEquivalent: {
      type: Number, // user ne kitna USDT ka buy kiya (display value)
      required: true,
    },

    ethSpent: {
      type: String, // String rakhna safe hai (precision loss se bachne ke liye)
      required: true,
    },

    ethPriceUSD: {
      type: Number, // us waqt ETH ka price
      default: null,
    },

    // ── Referrals ──────────────────────────────────────────────
    refs: {
      type: refsSchema,
      default: () => ({ ref1: null, ref2: null, ref3: null }),
    },

    // ── LLD Distribution ───────────────────────────────────────
    distribution: {
      type: distributionSchema,
      default: null, // null agar event parse fail ho gaya
    },

    // ── Status ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },

    // ── Timestamps ─────────────────────────────────────────────
    txTimestamp: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── Compound indexes ───────────────────────────────────────────
lldTransactionSchema.index({ buyer: 1, createdAt: -1 });
lldTransactionSchema.index({ userId: 1, createdAt: -1 });
lldTransactionSchema.index({ "refs.ref1": 1 });
lldTransactionSchema.index({ "refs.ref2": 1 });
lldTransactionSchema.index({ "refs.ref3": 1 });

const LldTransaction = mongoose.model("LldTransaction", lldTransactionSchema);

export default LldTransaction;
