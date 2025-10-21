import mongoose from "mongoose";
import User from "./UserModel.js";

const user1 = await User.findOne({ email: "vishwajeet@gmail.com" });
const user2 = await User.findOne({ email: "vishwajeet@gmail.com" });

//Same as transaction
console.log(user1.__v);
user1.balance += 500;
await user1.save();
console.log(user1.__v);

console.log(user2.__v);
user2.balance += 200;
await user2.save();
console.log(user2.__v);

// User.updateOne({email: "vishwajeet@gmail.com", __v: 3 })

await mongoose.disconnect();
