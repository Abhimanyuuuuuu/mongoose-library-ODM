insert array values
db.users.findOneAndUpdate({email:"admin@gmail.com"},{$push:{role:"User"}})

remove array values
db.users.findOneAndUpdate({email:"admin@gmail.com"},{$pull:{role:'admin'}})

multiple values insert
db.users.findOneAndUpdate({email:"admin@gmail.com"},{$addToSet:{role:{$each:['admin','owner']}}})

remove multiple vales in array
db.users.findOneAndUpdate({email:"admin@gmail.com"},{$pull:{role:{$in:['admin','owner']}}})

### Introduction to Document Versioning in Mongoose: From Basics to Advanced

Hey there! Let's dive deep into Document Versioning in Mongoose. I'll start from the absolute basics, assuming you might be new to some of this, and gradually build up to the more advanced stuff. We'll use simple, everyday language—like explaining it to a friend over coffee. I'll include real-life examples (think editing a shared Google Doc), code snippets (mostly in JavaScript with Mongoose), and step-by-step breakdowns of complex ideas. Along the way, I'll add extra insights, background knowledge, and related concepts to give you a full picture. This way, you'll not only understand _what_ it is but _why_ it matters and how to use it effectively.

Your provided points are spot on—they cover the core of Mongoose's versioning system. I'll weave them in and expand with more details you should know, like limitations, error handling, and how it ties into broader database concepts. Those Mongosh commands you shared (for array updates in MongoDB) are related because array changes can trigger versioning in Mongoose, but I'll explain why and how they differ when using Mongoose vs. raw MongoDB.

#### Step 1: Background Knowledge – What Are MongoDB and Mongoose?

Before we talk about versioning, let's set the stage. This is crucial because versioning solves problems in _document-based databases_ like MongoDB.

- **MongoDB Basics**: MongoDB is a NoSQL database that stores data as flexible "documents" (think JSON-like objects) in collections (like tables). Each document has an `_id` (unique identifier) and can have fields like `name`, `age`, or even nested arrays/objects. Unlike traditional SQL databases (e.g., MySQL), MongoDB doesn't enforce strict schemas, making it great for apps with evolving data.

- **Mongoose Basics**: Mongoose is a Node.js library that acts as a "wrapper" around MongoDB. It adds structure (schemas) to your documents, making it easier to validate data, query, and manage relationships. Think of Mongoose as a helpful translator—it turns your JavaScript code into MongoDB operations while adding features like versioning.

**Why Versioning Matters (Real-Life Analogy)**: Imagine a shared grocery list app where multiple people (e.g., roommates) edit the same list at the same time. If one person adds "milk" and another removes "bread" simultaneously, you don't want one change to accidentally overwrite the other, leading to a messed-up list. Versioning is like adding a "last edited" timestamp or counter to the list—it checks if the version you're editing is the latest before saving, preventing conflicts.

**Insight**: In databases, this is part of _concurrency control_—handling multiple users/processes accessing the same data. There are two main types: _Pessimistic locking_ (lock the data while editing, like checking out a library book) vs. _Optimistic locking_ (assume no conflicts, but check at save time). Mongoose's versioning leans toward optimistic, which is efficient for most web apps but requires handling errors when conflicts happen.

#### Step 2: What Is Document Versioning in Mongoose? The Essentials

At its core, document versioning tracks changes to a document over time using a special field. This helps prevent "lost updates" in concurrent scenarios.

- **The `__v` Field (Your First Point)**: Mongoose automatically adds a field called `__v` (short for "version") to every new document. It starts at 0 and acts like a counter for how many times the document has been modified. It's not something you manually set—it's internal.

  **How It Works Step-by-Step**:

  1. When you create a document, Mongoose sets `__v: 0`.
  2. Every time you modify and save the document (using `.save()`), Mongoose checks if changes were made. If yes, it increments `__v` by 1.
  3. This only happens on actual modifications—saving an unchanged document doesn't bump it.

  **Code Example** (Basic Creation and Save):

  ```javascript
  const mongoose = require("mongoose");
  const { Schema } = mongoose;

  // Connect to MongoDB (assume you're connected)
  mongoose.connect("mongodb://localhost:27017/mydatabase");

  // Define a simple schema
  const userSchema = new Schema({ name: String, age: Number });

  const User = mongoose.model("User", userSchema);

  // Create a new document
  const newUser = new User({ name: "Alice", age: 30 });
  await newUser.save(); // Saves with { _id: ..., name: 'Alice', age: 30, __v: 0 }

  // Modify and save
  newUser.age = 31;
  await newUser.save(); // Now { ..., age: 31, __v: 1 }
  ```

  **Real-Life Example**: In a blog app, `__v` tracks post revisions. If an editor updates a post (e.g., fixes a typo), `__v` goes from 0 to 1. This helps log changes or detect if someone else edited it meanwhile.

- **Automatic Increment on `.save()` (Your Second Point)**: As shown above, `.save()` is the trigger. It's Mongoose's way of updating a single document instance. Direct MongoDB updates (like your Mongosh commands) bypass this—more on that later.

**Additional Insight**: `__v` is stored as a Number in MongoDB. It's not indexed by default, so for large apps, you might index it if querying by version (rare). Also, versioning is per-document, not global.

#### Step 3: Why Use Versioning? Optimistic Concurrency Basics (Your Third Point)

Versioning shines in _optimistic concurrency control_—preventing overwrites when multiple processes edit the same document.

- **The Problem Without Versioning**: Two users load the same document (e.g., a user profile). User A changes the name and saves. User B changes the email and saves. User B's save overwrites User A's change—lost update!

- **How Versioning Helps**: It adds a check: "Is this the version I started with?" If not, throw an error.

  **Default Behavior (Without Extra Options)**: Versioning is always on, but it only strictly checks for conflicts in _arrays_ (e.g., if one process adds/removes items, shifting indices, and another tries to edit a specific index). For other fields, it just increments `__v` but doesn't block saves.

  **Real-Life Example**: In an e-commerce app, a product's "reviews" array. If Admin A deletes a review (shifting indices) and Admin B edits review #3 (now invalid), versioning catches this and errors on B's save.

- **Changes to Arrays or Subdocuments Increase `__v` (Your Fifth Point)**: Yes! Adding, removing, or modifying nested data (arrays or subdocs) counts as a change. Your Mongosh commands demonstrate this in raw MongoDB:

  - `$push` or `$addToSet` adds to arrays (increments `__v` if done via Mongoose `.save()`).
  - `$pull` removes (same).
    But in raw Mongosh/MongoDB, these don't touch `__v`—Mongoose adds that magic.

  **Code Example with Arrays**:

  ```javascript
  const postSchema = new Schema({ title: String, comments: [String] });
  const Post = mongoose.model("Post", postSchema);

  const post = new Post({ title: "My Post", comments: ["Great!"] });
  await post.save(); // __v: 0, comments: ['Great!']

  post.comments.push("Awesome!"); // Modify array
  await post.save(); // __v: 1, comments: ['Great!', 'Awesome!']
  ```

  **Insight**: Subdocuments are like mini-documents nested inside (e.g., { address: { street: String } }). Updating `street` increments the parent's `__v`. This ensures nested changes are tracked.

#### Step 4: Enabling Full Optimistic Concurrency (Your Fourth Point)

To make versioning block _all_ concurrent changes (not just arrays), enable `optimisticConcurrency: true`. This turns on strict checks for the entire document.

- **How to Enable**: Add it to your schema options.

  **Code Example**:

  ```javascript
  const houseSchema = new Schema(
    {
      status: String,
      photos: [String],
    },
    { optimisticConcurrency: true }
  ); // Enable here

  const House = mongoose.model("House", houseSchema);

  // Create
  const house = new House({
    status: "PENDING",
    photos: ["photo1.jpg", "photo2.jpg"],
  });
  await house.save(); // __v: 0

  // Concurrent simulation
  const houseA = await House.findById(house._id); // Loads __v: 0
  const houseB = await House.findById(house._id); // Loads __v: 0

  houseA.photos = []; // Clear photos
  await houseA.save(); // Succeeds, __v: 1

  houseB.status = "APPROVED"; // Try to approve (but photos are now invalid)
  await houseB.save(); // Throws VersionError! Because __v mismatched (expected 0, but DB has 1)
  ```

  **Breakdown**:

  1. Load document with current `__v`.
  2. Modify and `.save()`—Mongoose runs an update like: `updateOne({ _id: id, __v: current }, { changes, $inc: { __v: 1 } })`.
  3. If `__v` changed meanwhile, update finds no match → error.

  **Real-Life Example**: In a rental app, approve a house only if it has 2+ photos. Without this, a concurrent photo removal could approve an invalid house. With it, the approval fails, forcing a reload.

**Background Knowledge**: This is "optimistic" because it assumes conflicts are rare (optimistic outlook). If frequent, consider pessimistic locking (e.g., via MongoDB transactions with locks), but that's heavier on performance.

#### Step 5: Customizing or Disabling Versioning (Your Sixth Point)

You can tweak the version key for flexibility.

- **Customize the Key**: Change `__v` to something else, like `revision`.

  **Code Example**:

  ```javascript
  const schema = new Schema({ name: String }, { versionKey: "revision" });
  const Model = mongoose.model("Model", schema);

  const doc = new Model({ name: "Test" });
  await doc.save(); // { _id: ..., name: 'Test', revision: 0 }
  ```

- **Disable It**: Set `versionKey: false`. But beware—no conflict detection!

  **Code Example**:

  ```javascript
  const schema = new Schema({ name: String }, { versionKey: false });
  // Now no version field at all
  ```

  **When to Use**: If you're handling concurrency elsewhere (e.g., with Redis locks) or for simple apps with no multi-user edits.

**Insight**: Disabling affects subdocs too. Also, if using `toObject()` or `toJSON()`, set `{ versionKey: false }` there to hide `__v` in outputs, but it doesn't disable the mechanism.

#### Step 6: Deeper Dive – How Versioning Interacts with Updates and Limitations

Your Mongosh commands (e.g., `findOneAndUpdate` with `$push`) are raw MongoDB ops. In Mongoose, methods like `Model.findOneAndUpdate()` _don't_ automatically increment `__v` or check versions—only `.save()` does.

- **Why?** `.save()` uses Mongoose's change tracking; updates are direct to DB.

- **Workaround: Middleware to Increment `__v` on Updates**:
  Add a pre-hook to your schema.

  **Code Example**:

  ```javascript
  userSchema.pre("findOneAndUpdate", function () {
    const update = this.getUpdate();
    // Clean up any manual __v in update
    if (update.__v != null) delete update.__v;
    // Increment __v
    this.set({ $inc: { __v: 1 } });
  });
  ```

  Now, `User.findOneAndUpdate({ email: 'admin@gmail.com' }, { $push: { role: 'User' } })` will increment `__v`.

**Additional Insight**: For bulk ops (e.g., `bulkWrite()`), versioning applies per op if using `.save()`-like behavior. Also, versioning doesn't work in queries/aggregations—it's write-only.

#### Step 7: Advanced Aspects – SkipVersioning, Errors, Plugins, and More

Now, let's go deeper.

- **SkipVersioning**: Exclude specific paths (e.g., arrays) from triggering `__v` increments. Useful for logs that shouldn't bump versions.

  **Code Example**:

  ```javascript
  const schema = new Schema(
    {
      name: String,
      logs: [String],
    },
    { skipVersioning: { logs: true } }
  ); // Use full path if nested

  const doc = new Model({ name: "Test", logs: [] });
  await doc.save(); // __v: 0

  doc.logs.push("New log");
  await doc.save(); // __v still 0! (skipped)
  ```

  **Warning**: This can lead to undetected conflicts—use sparingly.

- **Error Handling: VersionError**: When conflicts happen, catch and retry.

  **Code Example**:

  ```javascript
  try {
    await doc.save();
  } catch (err) {
    if (err.name === "VersionError") {
      console.log("Conflict! Reloading...");
      const freshDoc = await Model.findById(doc._id);
      // Reapply changes to freshDoc and save again
    }
  }
  ```

  **Insight**: The error message includes ID, expected version, and modified paths—super helpful for debugging.

- **Plugins for Enhanced Concurrency**: Mongoose has community plugins like `mongoose-update-if-current` (from your search results). It adds versioning to update methods automatically.

  **Example Usage**:

  ```javascript
  const updateIfCurrentPlugin = require("mongoose-update-if-current");
  schema.plugin(updateIfCurrentPlugin, { versionKey: "__v" });
  ```

- **Related Ideas**: Combine with Mongoose _timestamps_ (`{ timestamps: true }`) for `createdAt/updatedAt` fields—they complement versioning by tracking _when_ changes happened. For transactions (atomic multi-doc ops), use `session.startTransaction()`—versioning works inside them.

- **Advanced Tip: Manual Version Handling**: If needed, query with `__v` (e.g., `findOne({ _id: id, __v: expected })`). Or use external tools like Redis for distributed locking in big apps.

- **Potential Pitfalls**: Versioning adds overhead (extra field, checks)—fine for most, but optimize for high-throughput. Also, in replicas (MongoDB clusters), ensure reads are from primaries for fresh versions.

#### Wrapping Up: Key Takeaways and When to Use

- **Essentials**: `__v` tracks mods via `.save()`, helps concurrency, customizable/disableable.
- **Advanced**: Enable `optimisticConcurrency` for strict control, handle errors, use middleware for updates.
- **Your Mongosh Tie-In**: Those are great for raw array ops, but wrap them in Mongoose for versioning benefits.
- **Final Insight**: Versioning promotes data integrity in multi-user apps (e.g., CMS, e-commerce). If your app is single-threaded/simple, you might skip it. Always test concurrent scenarios!

If anything's unclear or you want more examples, just ask!
