import mongoose from "mongoose";

await mongoose.connect("mongodb://admin:admin@localhost");

mongoose.set("autoCreate", false);

const UserModel = mongoose.model("User", { name: String, age: Number });

const data = await UserModel.insertOne({});
console.log(data);

console.log("Database connected");
