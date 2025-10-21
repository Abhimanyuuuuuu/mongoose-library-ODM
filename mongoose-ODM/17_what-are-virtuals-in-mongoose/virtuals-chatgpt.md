# Mongoose Virtuals — from basics to advanced (plain language + practical examples)

Nice — you already have a good start. I’ll take you from the ground up, fill in gaps, explain gotchas, and show practical code you can drop into a project. I’ll keep language friendly and show real-life examples (including the `hobbiesString` case you hinted at).

---

# 1) What is a virtual in Mongoose?

**Short answer:** a _virtual_ is a computed property on a Mongoose document. It behaves like a normal property when you read/write it in your JavaScript code, but it **is not stored in MongoDB** and **cannot be indexed or queried** like a real field.

**Real-life analogy:** think of a `fullName` shown on a webpage that's built from `firstName` + `lastName`. You don’t store it in the database because you can compute it anytime — the virtual is that computed field.

---

# 2) Why use virtuals?

- Keep your data _normalized_ (store minimal raw fields) and compute derived values on the fly.
- Build API-friendly outputs (format dates, hide raw fields, include computed display text).
- Implement convenient getters/setters that convert between shapes (e.g., `hobbiesString` ↔ `hobbies` array).
- Create _virtual populate_ (reverse relationship) so you can fetch related docs without embedding or changing schema.

---

# 3) Basic syntax

```js
// Node + Mongoose (CommonJS or ESM)
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
});

// getter-only virtual
userSchema.virtual("fullName").get(function () {
  return `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
});

// getter + setter virtual
userSchema
  .virtual("fullName")
  .get(function () {
    return `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
  })
  .set(function (v) {
    // assume v is "John Doe"
    const parts = v.split(" ");
    this.firstName = parts.shift();
    this.lastName = parts.join(" ");
  });

const User = mongoose.model("User", userSchema);
```

- Use `function () {}` not arrow functions when you need access to `this` (the document).
- Virtuals are declared on the schema via `schema.virtual(name)`.

---

# 4) Accessing virtuals in output: toObject / toJSON

By default, virtuals do **not** appear in `JSON.stringify(doc)` or `doc.toObject()`/`doc.toJSON()` results. You must opt-in:

```js
// Option A: enable on the schema globally
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

// Option B: enable per-call
const doc = await User.findOne({ _id: id });
const plainObj = doc.toObject({ virtuals: true });
console.log(JSON.stringify(plainObj)); // has virtual fields

// or:
console.log(doc.toJSON({ virtuals: true }));
```

You can also add a `transform` function to `toJSON` or `toObject` to remove `_id`, `__v`, or to change shape.

```js
userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    // convert _id to id string:
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
});
```

---

# 5) The built-in `id` virtual

- Mongoose **adds an `id` virtual by default** (a string version of `_id`). If you don't want that, you can turn it off:

```js
// disable schema-level id virtual
userSchema.set("id", false);
```

---

# 6) Virtuals vs. Schema getters

Mongoose also supports **path getters** (a getter attached to a field definition) which run when the field is retrieved; those are different from virtuals. Virtuals can combine multiple fields or expose properties not present in the schema.

---

# 7) Example: `fullName` (getter + setter) — practical

```js
const userSchema = new Schema({
  firstName: String,
  lastName: String,
});

userSchema
  .virtual("fullName")
  .get(function () {
    return `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
  })
  .set(function (v) {
    const [first, ...rest] = v.split(" ");
    this.firstName = first;
    this.lastName = rest.join(" ");
  });

const User = mongoose.model("User", userSchema);

// usage
const u = new User({ firstName: "Jane", lastName: "Doe" });
console.log(u.fullName); // "Jane Doe"

u.fullName = "Alice Wonderland";
console.log(u.firstName); // "Alice"
console.log(u.lastName); // "Wonderland"
```

---

# 8) Your `hobbiesString` example — implemented as a virtual

You had lines like:

```js
user.hobbies = user.hobbiesString + ` reading, cooking`;
console.log(user.hobbiesString);
```

A nice pattern: store `hobbies` as an array in DB; expose a string virtual `hobbiesString` that joins/splits.

```js
const userSchema = new Schema({
  name: String,
  hobbies: [String], // stored in DB
});

// virtual to get + set the string version
userSchema
  .virtual("hobbiesString")
  .get(function () {
    // join into a CSV-like string
    return (this.hobbies || []).join(", ");
  })
  .set(function (v) {
    // accept string like "reading, cooking" or array
    if (Array.isArray(v)) {
      this.hobbies = v;
    } else if (typeof v === "string") {
      this.hobbies = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  });

const User = mongoose.model("User", userSchema);

// usage
const u = new User({ hobbies: ["cycling"] });
console.log(u.hobbiesString); // "cycling"

u.hobbiesString = u.hobbiesString + ", reading, cooking";
console.log(u.hobbies); // ['cycling','reading','cooking']
```

Important: if `hobbiesString` is a virtual (setter), assigning `u.hobbiesString = ...` modifies `u.hobbies` in-memory. To persist, call `await u.save()`.

---

# 9) Virtuals & `.lean()`

- `.lean()` returns plain JS objects (not Mongoose documents). By default, virtuals are **not** applied.
- You can enable virtuals for lean queries:

```js
// requires Mongoose >= 5.6 (API depends on version)
const docs = await User.find().lean({ virtuals: true });
```

If your Mongoose version doesn't support `lean({ virtuals: true })`, you can use a plugin like `mongoose-lean-virtuals` or apply transformations yourself.

Note: `lean()` avoids the overhead of mongoose documents — good for read-heavy queries — but you'll lose methods and populated getters unless you enable them.

---

# 10) Virtual populate (reverse / inverse populate)

Virtuals can also _define relationships_ without storing foreign keys on the parent. Example: you store `authorId` on `Post` and want `user.posts` array via a virtual.

```js
// User schema
userSchema.virtual("posts", {
  ref: "Post", // model to use
  localField: "_id", // field on User
  foreignField: "author", // field on Post
  // justOne: false // default false; set true for single doc
});

// Then when querying:
const user = await User.findOne({ _id: userId }).populate("posts");
// user.posts is an array of posts
```

This is called **virtual populate**. It avoids embedding arrays of IDs in the parent and is convenient for one-to-many relations where the many side stores the reference.

---

# 11) Virtual populate + `.lean()`

Populate usually returns documents; if you `.lean()` you’ll get plain objects. Use `lean({ virtuals: true })` where available. Populating virtuals works the same conceptually.

---

# 12) Limitations & Gotchas

- **Not stored** in DB — so you **cannot query** by virtuals (e.g., `User.find({ fullName: 'X' })` won't work).

  - Workaround: use aggregation (`$addFields`), store computed field in DB if you need to query it, or compute client-side.

- **Cannot be indexed** because they're not real fields in MongoDB.
- Virtuals are computed **per document** — for very large result sets computing many virtuals adds CPU cost.
- Virtual setter runs on the document instance — if you mutate via `Model.update...` (without a doc), virtuals are not involved.
- Virtuals are not applied to plain objects unless you enable them in `toJSON/toObject` or use `lean({ virtuals: true })`.

---

# 13) Virtuals & validation / middleware

- Virtuals are not included in Mongoose validation for schema paths (since they’re not schema paths).
- If your virtual setter assigns to real schema fields, those fields are validated when you `save()`.
- You can use virtuals in pre/post hooks if you have a document instance. But if you do `Model.updateOne(...)` you won't have a document to run virtual setters on.

---

# 14) Using virtuals with TypeScript (short note)

If you use TypeScript, virtuals need to be reflected in your types. Typical approach:

```ts
interface UserAttrs {
  firstName: string;
  lastName: string;
}

interface UserDoc extends mongoose.Document {
  firstName: string;
  lastName: string;
  fullName?: string; // virtual
}
```

Make sure compiler/types include the virtual property if you access it on the doc.

---

# 15) Virtuals + JSON transform for APIs (common pattern)

Use `toJSON.transform` to shape API responses and include virtuals:

```js
userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    // optionally delete sensitive fields
    delete ret.password;
    return ret;
  },
});
```

This keeps controllers simple: `res.json(user)` will send nice object with virtuals.

---

# 16) Example: Practical full User schema with many virtuals

```js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  dob: Date,
  hobbies: [String],
  parentId: { type: Schema.Types.ObjectId, ref: "User" }, // example
});

// virtual: full name
userSchema
  .virtual("fullName")
  .get(function () {
    return `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
  })
  .set(function (v) {
    const [first, ...rest] = (v || "").split(/\s+/);
    this.firstName = first;
    this.lastName = rest.join(" ");
  });

// virtual: age (computed from dob)
userSchema.virtual("age").get(function () {
  if (!this.dob) return undefined;
  const diff = Date.now() - this.dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
});

// virtual: hobbiesString
userSchema
  .virtual("hobbiesString")
  .get(function () {
    return (this.hobbies || []).join(", ");
  })
  .set(function (v) {
    if (typeof v === "string") {
      this.hobbies = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(v)) {
      this.hobbies = v;
    }
  });

// virtual populate example: posts
userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);
```

---

# 17) Virtuals and populate in the code snippet you gave

Your snippet:

```js
import { User } from "./UserModel.js";

const user = await User.findOne({
  email: "ssr@gmail.com",
}).populate({ path: "parentId", select: "name age email" });

user.hobbies = user.hobbiesString + ` reading, cooking`;

console.log(user.hobbiesString);
```

Notes:

1. If `hobbiesString` is defined as a **virtual** (setter/getter) then:

   - `user.hobbiesString` gets the string representation (`.get()`).
   - `user.hobbies = user.hobbiesString + ' reading, cooking'` assigns to the real array field `hobbies` (but you are mixing string + array, so better set `user.hobbiesString` instead).

2. Better pattern: assign to the virtual setter:

```js
// safer: modify via the virtual setter which will update the underlying array
user.hobbiesString =
  (user.hobbiesString ? user.hobbiesString + ", " : "") + "reading, cooking";
await user.save();
console.log(user.hobbiesString);
```

3. If you set `user.hobbies = user.hobbiesString + ' reading, cooking'` then `user.hobbies` becomes a string (not an array) — unless you convert it properly. So prefer setting the virtual `hobbiesString` rather than overriding the array directly.

---

# 18) Advanced: virtuals in aggregation & querying alternatives

- Virtuals themselves are JavaScript-level. If you need the computed field inside a MongoDB query (for filtering/sorting server-side), use the aggregation pipeline with `$addFields`, `$project`, or `$expr`:

```js
// e.g. compute full name server-side
Model.aggregate([
  {
    $addFields: {
      fullName: { $concat: ["$firstName", " ", "$lastName"] },
    },
  },
  { $match: { fullName: "John Doe" } },
]);
```

- If this is a frequent query, consider storing the computed value in the collection (and updating it with middleware or application logic) so it can be indexed.

---

# 19) Plugins & helper libs

- `mongoose-lean-virtuals`: apply virtuals to lean results if your Mongoose version lacks built-in support or you want consistent behavior.
- `mongoose-virtuals` — older packages exist; check up-to-date options before adding dependencies.

---

# 20) Performance & best practices

- Keep virtual computation cheap. Avoid heavy synchronous computations per document (e.g., slow crypto operations) inside virtual getters.
- If you fetch thousands of docs and compute a complex virtual for each, consider:

  - computing on the client/UI,
  - doing it in aggregation pipeline,
  - or caching computed values in DB fields (with tradeoffs).

- Use virtual populate for occasional reads (e.g., show posts for a user). For extremely high-traffic operations, denormalize one side (store counts) for quick access.

---

# 21) Quick checklist / cheat-sheet

- Use `schema.virtual('name').get(fn)` for read-only virtuals.
- Chain `.set(fn)` for writable virtuals that update real fields.
- Always use `function()` (not arrow) when accessing `this`.
- Virtuals are not saved to DB — to persist derived results, write them to real fields.
- Enable virtuals in output via:

  - `schema.set('toJSON', { virtuals: true })`
  - `schema.set('toObject', { virtuals: true })`

- `.lean()` removes document features; enable virtuals with `lean({ virtuals: true })` or plugin.
- Virtuals cannot be used in MongoDB queries; use aggregation or persist values if you need to query them.
- Virtual populate = define relation without storing array of refs on parent.
- The default `id` virtual exists; disable with `schema.set('id', false)`.

---

# 22) Troubleshooting common problems

- **Virtual not showing up in API JSON** → enable virtuals via schema `toJSON`/`toObject` or pass options to `toObject()`/`toJSON()` per call.
- **Virtual setter not running when updating** → setters run on document instances, not on `updateOne()` or `findByIdAndUpdate()` calls. Read → modify → save instead, or apply transformations explicitly.
- **`.lean()` removed virtuals** → use `lean({ virtuals: true })` or the `mongoose-lean-virtuals` plugin.
- **Trying to query by virtual** → not possible. Use `$addFields` in aggregation or store computed field.

---

# 23) Small checklist for your specific snippet

Given:

```js
user.hobbies = user.hobbiesString + ` reading, cooking`;
console.log(user.hobbiesString);
```

- Better approach:

```js
// assuming hobbiesString virtual exists (string join)
user.hobbiesString = `${user.hobbiesString}${
  user.hobbiesString ? ", " : ""
}reading, cooking`;
await user.save(); // persist
console.log(user.hobbiesString); // shows updated list
```

- Or if you want to mutate array directly:

```js
user.hobbies = (user.hobbies || []).concat(["reading", "cooking"]);
await user.save();
```

---

# 24) Final tips & additional ideas

- Use virtuals to centralize display logic (e.g., date formatting) rather than scattering format code through controllers.
- Use `toJSON.transform` to remove sensitive fields (`password`, `tokens`) and to ensure virtuals appear consistently in API responses.
- When writing libraries or reusable models, document virtuals so other developers know they exist and how to use them.
- For TypeScript projects, keep your interfaces in sync with virtuals to avoid type errors.
- Consider virtuals for front-end convenience only (display fields) and not for core business logic that must persist or be queried.

---

If you want, I can:

- Turn your snippet into a full working example (complete schema + seed + queries).
- Convert examples to TypeScript types + Mongoose with `mongoose.Schema` generics.
- Show a working demo that demonstrates `lean({ virtuals: true })`, `virtual populate`, and `toJSON` transform.

Pick one and I’ll produce the full code you can run.
