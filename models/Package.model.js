// models/Package.js
import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  name: String,
  price: Number,
  dailyROI: Number,
  duration: Number,
  bonus: Number,
});

const Package = mongoose.model("Package", packageSchema);

export default Package;
