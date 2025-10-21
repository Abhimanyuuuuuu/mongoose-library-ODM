import mongoose from "mongoose";
import User from "./UserModel.js";

// const user = new User()                  // It will create a document or mongooge document which have a capability to talk to database  
// const user = await User.create({})      //  Another way to create mongoose document as we have many ways(like findOne , findById , and many more) to create mongoose document like whenever we can change the properties or update the properties and save it through user.save() then we can say that it's mongoose document and has a capability to talk to database

// From Queries: When you fetch data from the DB, you get Documents back which is mongoose document 

const user = await User.findById("67cb2deebdc4aad5e332e131");

const json = user.toJSON();

console.log(json);


// A mongoose document is nothing but an object with some extra methods and properties to perform database operations. If you want to understand it in depth then you'll have to understand OPPs in JavaScript. Here is the playlist link.

