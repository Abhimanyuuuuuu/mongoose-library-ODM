import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.findOne({ name: "Aman" });
const user2 = await User.find({ name: "Aman" });

// console.log(user);
// console.log(user2);

await mongoose.disconnect();
