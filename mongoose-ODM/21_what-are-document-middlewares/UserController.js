import mongoose from "mongoose";
import User from "./UserModel.js";

const user = new User({
  name: "Aman",
  age: 30,
  email: "aman@gmail.com",
});

await user.save();

await mongoose.disconnect();
