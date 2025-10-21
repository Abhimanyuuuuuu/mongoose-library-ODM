import mongoose from "mongoose";
import User from "./UserModel.js";

//If we also want to fetch parent details of this user(aditya@gmail.com) --> Means populate more datails  and it will work only when we use ref key in parentId field of userSchema (This means that it references the user collection or model) but it will fetch the whole object

// const user = await User.findOne({ email: "aditya@gmail.com" }).populate(
//   "parentId"
// );

//If we just want to fetch the name and age of that parentId

const user = await User.findOne({ email: "aditya@gmail.com" }).populate({
  path: "parentId",
  select: "name age -_id"
});

console.log(user);

await mongoose.disconnect();
