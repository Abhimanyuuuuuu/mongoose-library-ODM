import mongoose from "mongoose";

console.log("Start UserModal.js");

const UserModel = mongoose.model("User", { name: String, age: Number });

const data = await UserModel.findOne({ name: "Ankit" });
console.log(data);

console.log("Running UserModal.js");
