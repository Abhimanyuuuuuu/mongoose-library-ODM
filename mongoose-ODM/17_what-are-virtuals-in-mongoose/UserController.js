import mongoose from "mongoose";
import User from "./UserModel.js";

const user = await User.findOne({ email: "ramesh@gmail.com" });

user.hobbiesString = "TT, Football";

console.log(user.hobbiesString);
console.log(user.emailDomain);

// await user.save();
// console.log(user.hobbiesString);
// console.log(user.isAdult);

// console.log(user);
// console.log(user.schema.virtuals);
// console.log(User.schema.virtuals);
// console.log(user.toJSON({ virtuals: true }));
console.log(user.toJSON());

await mongoose.disconnect();
