import User from "./UserModel.js";


const query = User.where("age")    // Query chaining
  .gte(12)
  .lte(15)
  .select("name age")
  .sort({ age: -1 })
  .exec();

// const query = User.find({email:"ebhi123@gmail.com"} , {name :1})  // We give projection as second argument as we give in mongodb
// query.select({"name , age") === query.select({name:1 , age:1})  // /Behind the it uses projection 
// query.select("-name")  // It is negation projection as in this query except name all the fields will be shown

// console.log(query.projection());
// console.log(query.getQuery());

console.log(await query);
