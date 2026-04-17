import mongoose from "mongoose";
import Package from "../models/Package.model.js";

const MONGO_URI = "";

// Investor bonus percentages
const BONUS_PERCENTAGES = {
  Starter: 10, // 25$ - 10%
  Basic: 8, // 50$ - 8%
  Standard: 6, // 100$ - 6%
  Silver: 4, // 250$ - 4%
  Gold: 2, // 500$ - 2%
  Platinum: 1, // 1000$ - 1%
  Diamond: 1, // 2500$ - 1%
  VIP: 1, // 5000$ - 1%
};

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
  }
}

async function seedPackages() {
  try {
    const packages = [
      { name: "Starter", price: 25, dailyROI: 1, duration: 250 },
      { name: "Basic", price: 50, dailyROI: 1, duration: 260 },
      { name: "Standard", price: 100, dailyROI: 1, duration: 280 },
      { name: "Silver", price: 250, dailyROI: 1.1, duration: 290 },
      { name: "Gold", price: 500, dailyROI: 1.2, duration: 330 },
      { name: "Platinum", price: 1000, dailyROI: 1.2, duration: 360 },
      { name: "Diamond", price: 2500, dailyROI: 1.3, duration: 360 },
      { name: "VIP", price: 5000, dailyROI: 1.5, duration: 400 },
    ];

    // Add bonus for each package
    const packagesWithBonus = packages.map((pkg) => {
      const bonusPercent = BONUS_PERCENTAGES[pkg.name] || 0;
      return {
        ...pkg,
        bonus: parseFloat(((pkg.price * bonusPercent) / 100).toFixed(2)), // calculate bonus
      };
    });

    await Package.deleteMany({});
    await Package.insertMany(packagesWithBonus);

    console.log("✅ Packages Seeded Successfully with Bonus");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
}

// 🚀 Run
async function run() {
  await connectDB();
  await seedPackages();
}

run();
