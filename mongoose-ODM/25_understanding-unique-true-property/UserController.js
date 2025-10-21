import mongoose from "mongoose";
import User from "./UserModel.js";

await User.init();

try {
  const user = await User.insertOne({
    name: "Vishwajeet",
    age: 20,
    email: "vishwajeet@gmail.com",
  });
  console.log(user);
} catch (err) {
  console.log(err);
}

await mongoose.disconnect();
