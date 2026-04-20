import mongoose from "mongoose";
import Stake from "../models/stake.model.js";
import User from "../models/user.model.js";

const MONGO_URI =
  "mongodb+srv://bhaisiddharth63:9696607477@cluster0.um4bii2.mongodb.net/LLD";

const seedStakes = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");

  // Pehle kuch real users fetch karo DB se
  const users = await User.find().limit(5);

  if (!users.length) {
    console.log("Koi user nahi mila — pehle users seed karo.");
    process.exit(1);
  }

  // Purane test stakes delete karo (optional)
  await Stake.deleteMany({});
  console.log("Old stakes cleared");

  const stakes = users.map((user, i) => ({
    userId: user._id,
    walletAddress:
      user.walletAddress || `0x000000000000000000000000000000000000000${i}`,
    txHash: `0xSEED${Date.now()}${i}abcdef1234567890abcdef1234567890abcdef${i}`,
    stakedAmount: [500, 1000, 2500, 5000, 10000][i] ?? 1000,
    status: "active",
  }));

  const inserted = await Stake.insertMany(stakes);
  console.log(`${inserted.length} stakes inserted:`);
  inserted.forEach((s) =>
    console.log(
      `  userId: ${s.userId} | amount: ${s.stakedAmount} | tx: ${s.txHash.slice(0, 20)}...`,
    ),
  );

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
};

seedStakes().catch((err) => {
  console.error(err);
  process.exit(1);
});
