import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.create({
  name: "Anurag",
  age: 86,
  email: "anurag@gmail.com",
});

console.log(user);
