import User from "./UserModel.js";

await User.findOne({ email: "ankit@gmail.com" }).lean();
await User.find().lean();