import User from "./UserModel.js";

const user = await User.findOneAndDelete({ email: "ankit@gmail.com" });

console.log(user);

// user.age = 14;

// user.save();
