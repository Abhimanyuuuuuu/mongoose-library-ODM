import mongoose, { Schema } from "mongoose";

console.log("Start UserModal.js");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name field is required. Please enter the name."],
      minLength: [3, "Kripaya 3 letters ka naam type kariye"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "age field is required. Please enter the age."],
      min: 12,
    },
    email: {
      type: String,
      required: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email",
      ],
      lowercase: true,
      trim: true,
    },
    hobbies: [String],
    parentId: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.age < 16;
      },
      default: null,
    },
  },
  {
    strict: "throw",
    timestamps: true,
    // versionKey: "__version", // false
    // collection: 'test',
  }
);

const User = mongoose.model("User", userSchema);

const data = await User.insertOne({
  name: "   Ankit   ",
  age: 13,
  email: "Ankit@gmail.com   ",
  hobbies: ["Coding"],
  parentId: "67ca9831f62d3420efddb6ff",
});
console.log(data);

console.log("Running UserModal.js");
