import mongoose from "mongoose";
import dotenv from "dotenv";
import Level from "../models/level.model.js";

dotenv.config();

const seedLevels = async () => {
  try {
    // ✅ MongoDB connect
    await mongoose.connect(
      "mongodb+srv://bhaisiddharth63:9696607477@cluster0.um4bii2.mongodb.net/UKROYALFX",
    );
    console.log("✅ MongoDB Connected");

    await Level.deleteMany();
    console.log("🗑️ Old levels removed");

    // ✅ 10 Level Data
    const levelsData = [
      { level: 1, percent: 10 },
      { level: 2, percent: 5 },
      { level: 3, percent: 3 },
      { level: 4, percent: 2 },
      { level: 5, percent: 1 },
      { level: 6, percent: 1 },
      { level: 7, percent: 0.5 },
      { level: 8, percent: 0.5 },
      { level: 9, percent: 0.25 },
      { level: 10, percent: 0.25 },
    ];

    // ✅ Insert
    await Level.insertMany(levelsData);

    console.log("🚀 10 Levels Seeded Successfully");

    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedLevels();
