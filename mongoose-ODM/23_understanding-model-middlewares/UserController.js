import mongoose from "mongoose";
import User from "./UserModel.js";

const result = await User.insertMany([
  { name: "Aman", age: 40, email: "a@gmail.com" },
  { name: "Raman", age: 20, email: "r@gmail.com" },
]);

// console.log(result);

await mongoose.disconnect();
