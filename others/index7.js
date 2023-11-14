//TH1: new < current
let a = [
    { id: 1, name: "a1" },
    { id: 2, name: "a2" },
    { id: 3, name: "a3" },
    { id: 4, name: "a4" },
    { id: 5, name: "a5" },
    { id: 6, name: "a6" },
];
let b = [
    { id: 1, name: "b1" },
    { id: 2, name: "b2" },
    { id: 10, name: "b3" },
    { id: 8, name: "b4" },
];

let c = [...a, ...b];
console.log(c);

// const idA = new Set(a.map((item) => item.id)); //current
// const idB = new Set(b.map((item) => item.id)); //new

// const A = b.filter((item) => idA.has(item.id));
// console.log(idA);
// console.log(idB);
// console.log(A);

// // If A.length == 0
// // Delete a
// // Insert b

// // If A.length != 0 (trùng 1 phần)
// // Lấy phần không trùng
// const B = b.filter((item) => !idA.has(item.id));
// const C = a.filter((item) => !idB.has(item.id));
// console.log("Trùng", A);
// console.log("Không trùng (new)", B);
// console.log("Không trùng (current)", C);
