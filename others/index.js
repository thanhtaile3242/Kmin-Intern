// Trường hợp 1: newList > currentList
// let newList = [
//     { id: 1, name: "a" },
//     { id: 2, name: "a" },
//     { id: 3, name: "a" },
//     { id: 4, name: "a" },
//     { id: 5, name: "a" },
//     { id: 6, name: "a" },
// ];

// let currentList = [
//     { id: 1, name: "a" },
//     { id: 2, name: "a" },
//     { id: 3, name: "a" },
//     { id: 4, name: "a" },
// ];

//

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

const uniqueIds_Current = new Set(currentList.map((item) => item.id));

const NotHavingUid = newList.filter((item) => !uniqueIds_Current.has(item.id));

const uniqueIds_New = new Set(newList.map((item) => item.id));
const deletedList = currentList.filter((item) => !uniqueIds_New.has(item.id));
console.log(uniqueIds_New);
console.log(deletedList); // id = 3 và id = 4

console.log(uniqueIds_Current);

console.log(NotHavingUid); // id: 5 và id: 6
