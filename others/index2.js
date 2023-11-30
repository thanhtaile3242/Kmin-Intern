const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;

    let aSet = new Set(a);
    let bSet = new Set(b);

    if (aSet.size !== bSet.size) return false;

    for (let item of aSet) {
        const aCount = a.filter((val) => val === item).length;
        const bCount = b.filter((val) => val === item).length;
        if (aCount !== bCount || !bSet.has(item)) return false;
    }

    return true;
};
const a = ["a1", "a3", "a6"];
const b = ["a2", "a1", "a6"];

console.log(arraysEqual(a, b));
