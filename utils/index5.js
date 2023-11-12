const data = [
    {
        name: "ABC",
        Answer: [{}, {}, {}],
    },
    {
        name: "CDE",
        Answer: [{}],
    },
    {
        name: "EFG",
        Answer: [{}, {}],
    },
];

const hasMoreThanThreeObjects = data.some((item) => item.Answer.length > 3);
console.log(hasMoreThanThreeObjects);
if (hasMoreThanThreeObjects) {
    console.log("At least one Answer array has more than 3 objects.");
} else {
    console.log("No Answer array has more than 3 objects.");
}
