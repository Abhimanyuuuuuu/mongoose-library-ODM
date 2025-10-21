### Additional Code Examples for Document Versioning in Mongoose

Building on our earlier deep dive, I'll add more code examples here to illustrate key concepts. These will cover a mix of basic, intermediate, and advanced scenarios, including error handling, custom middleware, bulk operations, and integration with other Mongoose features like population or transactions. I'll keep the explanations clear, with step-by-step breakdowns and real-life analogies where helpful. All examples assume you're using Mongoose 8.x (the latest as of 2025), connected to a MongoDB instance, and running in an async Node.js environment (e.g., with `async/await`).

Remember, to run these, you'll need:

- `npm install mongoose`
- A MongoDB connection: `mongoose.connect('mongodb://localhost:27017/testdb');`

#### Example 1: Basic Versioning with Array Modifications (Expanding on Arrays)

This shows how array changes increment `__v`, including multi-value operations like your Mongosh examples, but via Mongoose.

**Real-Life Analogy**: Think of a task management app where a project's "teamMembers" array gets updated by multiple managers—versioning ensures no accidental overwrites.

**Code Example**:

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Schema with an array
const projectSchema = new Schema({
  name: String,
  teamMembers: [String],
});

const Project = mongoose.model("Project", projectSchema);

// Create initial document
const project = new Project({ name: "App Launch", teamMembers: ["Alice"] });
await project.save(); // { ..., teamMembers: ['Alice'], __v: 0 }

// Add single value (like $push)
project.teamMembers.push("Bob");
await project.save(); // { ..., teamMembers: ['Alice', 'Bob'], __v: 1 }

// Add multiple values (like $addToSet with $each)
project.teamMembers.push(...["Charlie", "Dana"]); // Or use $addToSet in update
await project.save(); // { ..., teamMembers: ['Alice', 'Bob', 'Charlie', 'Dana'], __v: 2 }

// Remove single value (like $pull)
project.teamMembers = project.teamMembers.filter((member) => member !== "Bob");
await project.save(); // { ..., teamMembers: ['Alice', 'Charlie', 'Dana'], __v: 3 }

// Remove multiple values (like $pull with $in)
project.teamMembers = project.teamMembers.filter(
  (member) => !["Charlie", "Dana"].includes(member)
);
await project.save(); // { ..., teamMembers: ['Alice'], __v: 4 }
```

**Step-by-Step**:

1. Start with `__v: 0`.
2. Each `.save()` after modification increments `__v`.
3. For idempotent adds (no duplicates), you could use Mongoose's `update` with `$addToSet`: `await Project.findByIdAndUpdate(project._id, { $addToSet: { teamMembers: { $each: ['Eve', 'Frank'] } } });`—but this won't auto-increment `__v` unless you add middleware (see later example).

**Insight**: Arrays trigger versioning checks to prevent "array index out of bounds" issues in concurrent edits.

#### Example 2: Handling VersionError in Optimistic Concurrency

With `optimisticConcurrency: true`, let's simulate a conflict and handle the error.

**Real-Life Analogy**: Two chefs editing a shared recipe—one adds ingredients, the other changes instructions. Versioning stops one from overwriting without seeing the other's changes.

**Code Example**:

```javascript
const mongoose = require("mongoose");
const { Schema, versionError } = mongoose; // Note: VersionError is exported

const recipeSchema = new Schema(
  {
    title: String,
    ingredients: [String],
  },
  { optimisticConcurrency: true }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

// Create
const recipe = new Recipe({ title: "Pasta", ingredients: ["Tomato"] });
await recipe.save(); // __v: 0

// Simulate two concurrent edits
async function editA() {
  const loaded = await Recipe.findById(recipe._id); // __v: 0
  loaded.ingredients.push("Cheese");
  await loaded.save(); // Succeeds, __v: 1
}

async function editB() {
  const loaded = await Recipe.findById(recipe._id); // __v: 0 (before editA finishes)
  loaded.title = "Cheesy Pasta";
  try {
    await loaded.save(); // Throws VersionError if editA saved first
  } catch (err) {
    if (err instanceof mongoose.Error.VersionError) {
      console.log(
        `Conflict detected! Expected __v: ${loaded.__v}, but DB has higher. Reloading...`
      );
      const fresh = await Recipe.findById(recipe._id);
      fresh.title = "Cheesy Pasta"; // Reapply change
      await fresh.save(); // Now succeeds, __v: 2
    }
  }
}

// Run concurrently (in real apps, use promises or actual parallelism)
await Promise.all([editA(), editB()]);
```

**Step-by-Step**:

1. Enable `optimisticConcurrency`.
2. Load the same version in two places.
3. First save succeeds and increments.
4. Second save fails with `VersionError` (a specific Mongoose error).
5. Catch, reload the latest, reapply, and retry.

**Insight**: In production, add retries with exponential backoff to handle repeated conflicts.

#### Example 3: Custom Middleware for Versioning on Update Methods

As mentioned earlier, methods like `findOneAndUpdate` don't increment `__v` by default. This middleware fixes that.

**Real-Life Analogy**: Automating version stamps on all edits in a collaborative document app, even bulk ones.

**Code Example**:

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  email: String,
  roles: [String],
});

// Middleware for updates
userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  // Prevent manual __v tampering
  if (update.__v != null) delete update.__v;
  // Increment __v
  this.set({ $inc: { __v: 1 } });
  next();
});

// Also for other update methods if needed
userSchema.pre(
  "updateOne",
  userSchema.pre("findOneAndUpdate").bind(userSchema)
);

const User = mongoose.model("User", userSchema);

// Create
const user = new User({ email: "admin@gmail.com", roles: ["User"] });
await user.save(); // __v: 0

// Now updates increment __v
await User.findOneAndUpdate(
  { email: "admin@gmail.com" },
  { $push: { roles: "Admin" } }
); // __v: 1, roles: ['User', 'Admin']

await User.findOneAndUpdate(
  { email: "admin@gmail.com" },
  { $pull: { roles: { $in: ["Admin"] } } }
); // __v: 2, roles: ['User']
```

**Step-by-Step**:

1. Use `pre` hook on update queries.
2. Clean and add `$inc`.
3. Now your Mongosh-like ops via Mongoose respect versioning.

**Insight**: Extend to `updateMany` if needed, but be cautious—multi-doc updates don't have per-doc versioning.

#### Example 4: Disabling Versioning for Specific Paths with skipVersioning

For fields that change often but shouldn't trigger conflicts (e.g., view counts).

**Real-Life Analogy**: In a video platform, increment "views" without bumping the version, so title edits don't conflict unnecessarily.

**Code Example**:

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoSchema = new Schema(
  {
    title: String,
    views: Number,
  },
  {
    skipVersioning: { views: true }, // Skip for 'views' path
  }
);

const Video = mongoose.model("Video", videoSchema);

// Create
const video = new Video({ title: "Tutorial", views: 0 });
await video.save(); // __v: 0

// Change skipped field
video.views += 1;
await video.save(); // __v still 0! (no increment)

// Change non-skipped field
video.title = "Advanced Tutorial";
await video.save(); // __v: 1
```

**Step-by-Step**:

1. Set `skipVersioning: { path: true }`.
2. Mods to that path don't increment `__v` or trigger checks.
3. Useful for counters or logs.

**Insight**: For nested paths, use full dot notation, e.g., `skipVersioning: { 'stats.views': true }`.

#### Example 5: Versioning in Transactions with Multi-Document Ops

Mongoose supports sessions/transactions, and versioning works within them.

**Real-Life Analogy**: Banking app transferring funds between accounts—ensure both updates are atomic, with versioning to prevent concurrent transfers.

**Code Example**:

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const accountSchema = new Schema(
  { balance: Number },
  { optimisticConcurrency: true }
);

const Account = mongoose.model("Account", accountSchema);

// Create accounts
const acc1 = new Account({ balance: 100 });
const acc2 = new Account({ balance: 50 });
await Promise.all([acc1.save(), acc2.save()]); // Both __v: 0

// Transaction with versioning
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Load with session
  const loadedAcc1 = await Account.findById(acc1._id).session(session);
  const loadedAcc2 = await Account.findById(acc2._id).session(session);

  loadedAcc1.balance -= 20;
  loadedAcc2.balance += 20;

  await loadedAcc1.save({ session });
  await loadedAcc2.save({ session });

  await session.commitTransaction(); // Both __v: 1 if successful
} catch (err) {
  await session.abortTransaction();
  if (err instanceof mongoose.Error.VersionError) {
    console.log("Concurrent edit detected during transfer—retrying...");
    // Retry logic here
  }
} finally {
  session.endSession();
}
```

**Step-by-Step**:

1. Start session/transaction.
2. Load and save with session.
3. If conflict (e.g., external edit), `VersionError` aborts the whole transaction.
4. Commit atomically.

**Insight**: Transactions require MongoDB replica sets (not standalone). Versioning adds safety to multi-doc ops.

#### Example 6: Custom Version Key and Hiding in Outputs

Customize and hide `__v` in API responses.

**Code Example**:

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    name: String,
  },
  { versionKey: "rev" }
); // Custom key: 'rev'

itemSchema.set("toJSON", { versionKey: false }); // Hide in toJSON

const Item = mongoose.model("Item", itemSchema);

const item = new Item({ name: "Book" });
await item.save(); // Stored as { ..., rev: 0 }

console.log(item.toJSON()); // { _id: ..., name: 'Book' } — no 'rev'

item.name = "Ebook";
await item.save(); // { ..., rev: 1 }
```

**Step-by-Step**:

1. Set `versionKey: 'custom'`.
2. Use `toJSON` or `toObject` options to exclude.
3. Great for clean APIs.

These examples should give you a solid hands-on feel. If you want examples for specific scenarios (e.g., with virtuals or plugins), let me know!
