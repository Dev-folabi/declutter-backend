import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";

dotenv.config()
const DB_URI = process.env.MONGODB_URI || "";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
