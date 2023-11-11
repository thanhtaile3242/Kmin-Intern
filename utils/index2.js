// Trường hợp 2: newList < currentList
let newList = [
    { id: 1, name: "a" },
    { id: 2, name: "a" },
];

let currentList = [
    { id: 1, name: "a" },
    { id: 2, name: "a" },
    { id: 3, name: "a" },
    { id: 4, name: "a" },
];

const uniqueIds_New = new Set(newList.map((item) => item.id));
const deletedList = currentList.filter((item) => !uniqueIds_New.has(item.id));
console.log(uniqueIds_New);
console.log(deletedList); // id = 3 và id = 4
