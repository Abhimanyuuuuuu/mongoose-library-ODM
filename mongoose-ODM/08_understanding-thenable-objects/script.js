const myObj = {
  then(resolve) {
    h1.addEventListener("click", () => {
      resolve("I am resolved");
    });
  },
};

const data = await myObj;

console.log(data);

console.log(await myObj);
console.log(await myObj);
console.log(await myObj);
console.log(await myObj);

// myObj.then((data) => {
//   console.log(data);
// });
