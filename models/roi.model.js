import mongoose from "mongoose";

const aroiSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },

  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investment",
  },

  planName: {
    type: String,
  },

  investmentAmount: {
    type: Number,
    required: true,
  },

  roiAmount: {
    type: Number,
    required: true,
  },

  percentage: {
    type: Number,
    default: 0,
  },

  creditedOn: {
    type: Date,
    required: true,
  },

  isClaimed: {
    type: Boolean,
    default: false,
  },
});

// aroiSchema.index({ userId: 1, investmentId: 1 }, { unique: true });

const Aroi = mongoose.model("Aroi", aroiSchema);

export default Aroi;
