import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.findOne({ email: "aditya@gmail.com" }).populate(
  "parentId"
);

console.log(user);

await mongoose.disconnect();
