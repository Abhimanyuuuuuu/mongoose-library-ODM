import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.findByEmail("ramesh@gmail.com");

console.log(user.getSummary("full"));

await mongoose.disconnect();
