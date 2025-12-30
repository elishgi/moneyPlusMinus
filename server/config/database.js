// server/config/database.js
import mongoose from "mongoose";

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Please set it in server/.env");
  }

  mongoose.set("strictQuery", false);

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");
}
