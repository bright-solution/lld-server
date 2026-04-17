import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
      unique: true,
    },

    percent: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Level = mongoose.model("Level", levelSchema);
export default Level;
