import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.findOne({ email: "aditya@gmail.com" });

// const user1 = new User()

console.log(user.getSummary("full"));

await mongoose.disconnect();
