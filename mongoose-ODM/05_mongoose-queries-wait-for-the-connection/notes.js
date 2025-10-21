// Note-4  --> Now we can separete database connection code in db.js and if we create a new model like UserModel then autometically it will get the access of connection using import './db.js' in app.js

// import './db.js' will run the code of db.js it's called side effect import  ---> we can explore more on side effect import on below site
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import 

/*------------------------------------------------------------------------------------------------------------------------------------------------ */
// Note-3  Queries will fire after the database is connected even after we remove await from both the  queries 
import mongoose from "mongoose";

setTimeout(() => {
  const promise = mongoose.connect("mongodb://admin:admin@localhost"); // It returns a promise and we can use then methon on this
  console.log("Database connection requested");

  promise.then(() => {
    console.log("Database connected");
  });
}, 4000);

const UserModal = mongoose.model("User", { name: String, age: Number });

console.log("Inserting data");   //First this code will run as you know why its basic you lodu in both the Note-1 and Note-2 
// It is not guaranteed that which query will run first after removing await but when we add await then first query will fire first and then after and so on
UserModal.insertOne({ name: "Ebhi" });
const data = UserModal.findOne({ name: "Ebhi" });    // Both query(insert and find) will wait until connection is not made  now the data will be promise and we can use then method on this
data.then((d) => {
    console.log(d);
})

/*------------------------------------------------------------------------------------------------------------------------------------------------ */
// Note-2
// import mongoose from "mongoose";

// setTimeout(() => {
//   const promise = mongoose.connect("mongodb://admin:admin@localhost"); // It returns a promise and we can use then methon on this
//   console.log("Database connection requested");

//   promise.then(() => {
//     console.log("Database connected");
//   });
// }, 4000);

// const UserModal = mongoose.model("User", { name: String, age: Number });

// console.log("Inserting data");   //First this code will run as you know why its basic you lodu in both the Note-1 and Note-2 
// const data = await UserModal.insertOne({ name: "Ebhi" }); // This query or any other query will run or fire only after database is connected even we delay The connection using setTimeOut 
// const data1 = await UserModal.findOne({ name: "Ebhi" });    // Both query(insert and find) will wait until connection is not made 
// console.log(data1);
// console.log("Data inserted");
// console.log(data);


/*------------------------------------------------------------------------------------------------------------------------------------------------ */
// Note-1
// import mongoose from "mongoose";

// const promise = mongoose.connect("mongodb://admin:admin@localhost"); // It return a promise and we can use then methon on this
// console.log("Database connection requested");

// promise.then(() => {
//   console.log("Database connected");
// });

// const UserModal = mongoose.model("User", { name: String, age: Number });

// console.log("Inserting data");
// const data = await UserModal.insertOne({ name: "Ebhi" });   // This query or any other query will run only after database is connected
// console.log("Data inserted");
// console.log(data);
