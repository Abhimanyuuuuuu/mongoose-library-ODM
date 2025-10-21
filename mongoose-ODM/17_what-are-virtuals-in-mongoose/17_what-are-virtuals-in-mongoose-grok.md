Mongoose Virtuals

-> Virtuals are computed properties in Mongoose documents, not stored in MongoDB.
-> Common use: derive fullName from firstName + lastName.
-> Mongoose adds an id virtual by default (string version of \_id).

Creating Virtuals
-> Getter only
schema.virtual('fullName').get(() => ...)
-> Getter + Setter
schema.virtual('fullName').get(() => ...).set(val => ...)

Accessing Virtuals
-> Enable in output
doc.toJSON({ virtuals: true })
doc.toObject({ virtuals: true })
-> Schema-level access: schema.virtuals

Virtuals & .lean()
-> By default, virtuals do not work with .lean().
-> To include them:
Model.find().lean({ virtuals: true })

### Introduction to Mongoose: The Basics

Before diving into virtuals, let's start from the ground up. Imagine you're building a house (your application), and you need a blueprint to ensure everything fits together nicely. That's where Mongoose comes in.

Mongoose is a popular Object Data Modeling (ODM) library for Node.js and MongoDB. MongoDB is a NoSQL database that stores data in flexible, JSON-like documents (think of them as objects with key-value pairs, like `{ name: "Alice", age: 30 }`). Without Mongoose, working with MongoDB can feel like writing raw queries in a foreign language—error-prone and messy.

Mongoose acts as a "translator" and "organizer." It lets you define **schemas** (blueprints for your data) that enforce structure, validation, and relationships. From a schema, you create **models** (like factories that produce documents), and **documents** are the actual instances of data you save to or retrieve from the database.

- **Real-life example**: If MongoDB is a filing cabinet full of loose papers, Mongoose is the labeled folders and forms that ensure every paper has the right info in the right place.
- **Why it matters**: It adds features like data validation (e.g., "age must be a number"), middleware (hooks for actions like "before saving"), and—relevant here—virtuals for computed properties.

To get started, you'd install Mongoose via npm (`npm install mongoose`) and connect to MongoDB:

```javascript
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/mydatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

Now, let's define a simple schema and model:

```javascript
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
});

const User = mongoose.model("User", userSchema);
```

This creates a `User` model. You can then create, save, and query documents:

```javascript
const newUser = new User({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
});
await newUser.save(); // Saves to MongoDB
const foundUser = await User.findOne({ email: "john@example.com" });
console.log(foundUser); // { _id: ..., firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
```

Notice the `_id` field? MongoDB auto-adds this unique identifier to every document. Mongoose wraps these documents in its own objects, adding extra functionality.

### What Are Virtuals in Mongoose?

Virtuals are like "imaginary" properties on your Mongoose documents. They're not stored in the actual MongoDB database—they're computed on the fly when you access them. Think of them as shortcuts or derived values that make your data easier to work with, without cluttering your database.

- **Why not just store them?** Storing everything wastes space and requires updates whenever the source data changes. Virtuals compute dynamically, so they're always up-to-date.
- **Real-life example**: In a recipe app, you might have ingredients like "flour: 2 cups" and "sugar: 1 cup." A virtual could compute "total calories" by summing up each ingredient's calories—without saving that sum to the DB every time.
- **Background knowledge**: Virtuals are inspired by object-oriented programming concepts like getters/setters in classes. In JavaScript, they're similar to ES6 class getters (e.g., `get fullName() { return this.firstName + ' ' + this.lastName; }`).

From your notes: "Virtuals are computed properties in Mongoose documents, not stored in MongoDB." Spot on! And a common use is deriving `fullName` from `firstName` + `lastName`.

### The Default Virtual: The 'id' Property

Mongoose automatically adds a virtual called `id` to every schema. It's a string representation of the `_id` field (which is an ObjectId in MongoDB).

- **Why?** `_id` is a binary ObjectId, but sometimes you need a simple string for APIs or frontend use.
- **Example**:

```javascript
const user = await User.findOne({ email: "john@example.com" });
console.log(user._id); // ObjectId("507f1f77bcf86cd799439011") — binary-like
console.log(user.id); // "507f1f77bcf86cd799439011" — plain string
```

You can disable this if needed: `userSchema.id = false;`.

### Creating Virtuals: Step-by-Step

To add a virtual, you define it on your schema using `schema.virtual('propertyName')`. Virtuals can have **getters** (to read/compute the value) and **setters** (to update underlying fields when setting the virtual).

#### 1. Getter-Only Virtuals (Read-Only Computed Properties)

This is the simplest: Compute a value based on other fields.

- **Step-by-step**:

  1. Define your schema.
  2. Add `.virtual('name').get(function() { ... })`.
  3. The function runs when you access `doc.name`.
  4. Inside the getter, `this` refers to the document.

- **Code example** (building on our User schema):

```javascript
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
```

- **Usage**:

```javascript
const user = await User.findOne({ email: "john@example.com" });
console.log(user.fullName); // "John Doe" — computed on the fly!
```

- **Real-life analogy**: Like a smartwatch displaying "heart rate" by calculating from sensor data—it's not stored, just derived.

#### 2. Virtuals with Getters and Setters (Read/Write)

Add a setter to make the virtual writable. When you set the virtual, it updates the real fields.

- **Step-by-step**:

  1. Chain `.set(function(value) { ... })` after `.get()`.
  2. In the setter, parse the input and update fields.
  3. This keeps your data consistent.

- **Code example**:

```javascript
userSchema
  .virtual("fullName")
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (value) {
    const [first, last] = value.split(" ");
    this.firstName = first;
    this.lastName = last;
  });
```

- **Usage**:

```javascript
const user = new User();
user.fullName = "Jane Smith"; // Sets firstName='Jane', lastName='Smith'
await user.save();
console.log(user.fullName); // "Jane Smith"
```

- **Insight**: Setters are great for APIs where users send combined data (e.g., a form with "full name"). But be careful—if the input doesn't match your parsing (e.g., "John Middle Doe"), it might break. Add validation!

- **Advanced tip**: Virtuals can access other virtuals or methods. For example, a virtual could call a document method: `get() { return this.someMethod(); }`.

### Accessing Virtuals: How to Use Them in Your Code

By default, virtuals are available on document instances (like `user.fullName`). But when converting to plain objects or JSON (common for APIs), they're excluded to save bandwidth.

#### 1. Enabling Virtuals in Output

Use options when converting:

- **toJSON() and toObject()**:

```javascript
const jsonUser = user.toJSON({ virtuals: true });
console.log(jsonUser.fullName); // Included now!

// Or for plain objects:
const objUser = user.toObject({ virtuals: true });
```

- **Schema-level default**: Set it globally for the schema:

```javascript
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
```

Now, every `toJSON()` or `toObject()` includes virtuals automatically.

- **Why this matters**: In Express.js APIs, you might do `res.json(user)`, which calls `toJSON()`. Without this, virtuals vanish!

#### 2. Listing All Virtuals on a Schema

For debugging or introspection:

```javascript
console.log(userSchema.virtuals); // { fullName: VirtualType { ... }, id: VirtualType { ... } }
```

This shows all defined virtuals.

### Virtuals and .lean(): Performance Considerations

`.lean()` is a query option that returns plain JavaScript objects instead of full Mongoose documents. It's faster and uses less memory—great for read-heavy apps.

- **Default behavior**: Virtuals (and methods) are skipped with `.lean()` because it strips Mongoose wrappers.
- **From your notes**: "By default, virtuals do not work with .lean(). To include them: Model.find().lean({ virtuals: true })"

- **Code example**:

```javascript
const leanUsers = await User.find().lean({ virtuals: true });
console.log(leanUsers[0].fullName); // Works now!
```

- **Trade-off**: With `{ virtuals: true }`, you get virtuals but lose other Mongoose features like setters in updates. Use `.lean()` when you don't need to modify the data.
- **Background**: `.lean()` is like getting a photocopy of the document—quick but without the "live" features.

### Advanced Virtuals: Virtual Populate and More

Now, let's go deeper. Virtuals aren't just for simple computations—they can handle relationships and complex logic.

#### 1. Virtual Populate (Linking Models Without Refs)

Normally, Mongoose uses `populate()` for references (e.g., a User has a `parentId` ref to another User). But virtual populate lets you create "virtual" relationships without storing refs in the DB.

- **Why?** For one-way or computed links, saving space.
- **Step-by-step**:

  1. Define a virtual with `.applyGetters(true)` for population.
  2. Use options like `localField`, `foreignField`.

- **Code example** (assuming a User can have children):

```javascript
// In userSchema
userSchema.virtual("children", {
  ref: "User", // Model to populate from
  localField: "_id", // Field in this model
  foreignField: "parentId", // Field in the other model
  justOne: false, // Array of matches
});
```

- **Usage**:

```javascript
const user = await User.findOne({ email: "parent@example.com" }).populate(
  "children"
);
console.log(user.children); // Array of child User documents
```

- **Your code snippet seems related**: You have `user = await User.findOne(...).populate({ path: 'parentId', select: 'name age email' });`. This is standard populate on a real ref field. Virtual populate is similar but doesn't require `parentId` to be a schema field—it's computed.

#### 2. Virtuals in Queries and Aggregation

- Virtuals aren't queryable directly (since not in DB), but you can use them post-query.
- In aggregations (`Model.aggregate()`), add virtual-like computations using `$addFields`.

- **Example** (post-query):

```javascript
const users = await User.find();
users.forEach((user) => console.log(user.fullName)); // Works
```

#### 3. Async Virtuals (Advanced)

Getters/setters can be async! Use `async function() { ... }` and await when accessing.

- **Example**:

```javascript
userSchema.virtual("externalData").get(async function () {
  // Fetch from API (but remember, this runs every access—cache if needed!)
  const response = await fetch("https://api.example.com/data/" + this._id);
  return response.json();
});
```

- **Pitfall**: Async virtuals block until resolved, so use sparingly.

### Best Practices, Pitfalls, and Additional Insights

- **Best practices**:

  - Use virtuals for read-only derivations to keep DB lean.
  - Combine with schema paths for validation (e.g., validate `firstName` and `lastName`).
  - For performance: Virtuals run on access, so avoid heavy computations.
  - Testing: Use `doc.get('virtualName')` to force getter execution.

- **Common pitfalls**:

  - Forgetting to enable virtuals in `toJSON()`—leads to "missing" data in APIs.
  - Setters can overwrite data unexpectedly—add error handling.
  - Virtuals don't trigger middleware (e.g., pre-save hooks).
  - Not chainable in all queries: Can't use in `find({ fullName: 'John Doe' })` since not in DB.

- **Related ideas**:

  - **Methods vs. Virtuals**: Methods are functions on documents (e.g., `schema.methods.greet = function() { return 'Hi ' + this.fullName; }`). Virtuals are properties.
  - **Statics**: Schema-level functions (e.g., `schema.statics.findByFullName`).
  - **Plugins**: Reuse virtuals across schemas with Mongoose plugins.
  - **Alternatives**: If you need stored computed fields, use MongoDB's computed fields (v5+) or Mongoose middleware to update on save.
  - **Versioning**: Mongoose evolves—check docs for v8+ (current as of 2025). Virtuals have been stable since v4.

- **Useful background**: Mongoose builds on MongoDB drivers, so understanding BSON (Mongo's data format) helps—e.g., why `_id` is an ObjectId. Also, in large apps, consider TypeScript with Mongoose for type-safe virtuals.

Your provided code snippet: It populates `parentId`, updates `hobbies`, and logs `hobbiesString` (perhaps another virtual?). This ties into virtuals if `hobbiesString` is a virtual deriving from `hobbies` array, like:

```javascript
userSchema.virtual("hobbiesString").get(function () {
  return this.hobbies.join(", ");
});
```

That would make `console.log(user.hobbiesString);` output "reading, cooking" after update.

This covers virtuals comprehensively— from basics to advanced. If anything's unclear, ask!
