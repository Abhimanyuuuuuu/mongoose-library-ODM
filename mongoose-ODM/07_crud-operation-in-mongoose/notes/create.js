// Method-1
await User.insertOne({
  name: "Ankit",
  age: 13,
  email: "Ankit@gmail.com   ",
  hobbies: ["Coding"],
  parentId: "67ca9831f62d3420efddb6ff",
});

// Method-2
await User.create({
  name: "Ankit",
  age: 13,
  email: "Ankit@gmail.com   ",
  hobbies: ["Coding"],
  parentId: "67ca9831f62d3420efddb6ff",
});

// Method-3
await User.create([
  {
    name: "Ram",
    age: 13,
    email: "Ram@gmail.com   ",
    hobbies: ["Coding"],
    parentId: "67ca9831f62d3420efddb6ff",
  },
  {
    name: "Shyam",
    age: 13,
    email: "Shyam@gmail.com   ",
    hobbies: ["TT"],
    parentId: "67ca9831f62d3420efddb6ff",
  },
]);


// Method-4
const user = new User({
  name: "Jay",
  age: 13,
  email: "jay@gmail.com   ",
  hobbies: ["Coding"],
  parentId: "67ca9831f62d3420efddb6ff",
});

user.age = 20;
user.hobbies.push("Cooking");

const data = await user.save()
console.log(data);