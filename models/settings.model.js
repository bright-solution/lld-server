import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  withdrawalLimit: {
    type: Number,
    default: 3,
  },
  privateKey: {
    type: String,
  },
  walletAddress: {
    type: String,
    default: "",
  },
});

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
