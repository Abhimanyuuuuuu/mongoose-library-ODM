import mongoose from "mongoose";

await mongoose.connect("mongodb://admin:admin@localhost");

mongoose.set("autoCreate", false);
// mongoose.pluralize((word) => word)  // It will keep the word same or we can call it collection name 
// const pluralizer = mongoose.pluralize();

// console.log(pluralizer('mango'));
// mongoose.pluralize(
//   (word) => pluralizer(word.toLocaleLowerCase()) + "_collection"
// );

mongoose.model("Cat", {});

console.log("Database connected");
