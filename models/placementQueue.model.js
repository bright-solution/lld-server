import mongoose from "mongoose";

const placementQueueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      index: true,
    },
  },
  { timestamps: true },
);

export const PlacementQueue = mongoose.model(
  "PlacementQueue",
  placementQueueSchema,
);

export default PlacementQueue;
