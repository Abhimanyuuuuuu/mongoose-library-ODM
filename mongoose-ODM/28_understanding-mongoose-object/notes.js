// connect multiple databases using createConnection

import mongoose from "mongoose";

const conn1 = await mongoose.createConnection(
  "mongodb://admin:admin@localhost/db1"
);

const conn2 = await mongoose.createConnection(
  "mongodb://admin:admin@localhost/db2"
);

const User = conn1.model("User", new mongoose.Schema({ name: String }));
const Product = conn2.model("Product", new mongoose.Schema({ title: String }));

await User.create({ name: "Prerak" });
await Product.create({ title: "Laptop" });
