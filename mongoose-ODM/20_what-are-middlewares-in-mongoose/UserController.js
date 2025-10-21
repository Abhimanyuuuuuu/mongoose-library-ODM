import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.find({ email: "ramesh@gmail.com" });

console.log(user);

await mongoose.disconnect();
