let a = {
    ten: "Lê Thành Tài",
    tuoi: 22,
    diaChi: "Tay Ninh",
};
let b = {
    ten: "Tài Thành Lê",
};

// console.log(a);

let A = [
    {
        ten: "Lê Thành Tài 1",
        tuoi: 22,
        diaChi: "Tay Ninh",
    },
    {
        ten: "Lê Thành Tài 2",
        tuoi: 22,
        diaChi: "Tay Ninh",
    },
    {
        ten: "Lê Thành Tài 3",
        tuoi: 22,
        diaChi: "Tay Ninh",
    },
    {
        ten: "Lê Thành Tài 4",
        tuoi: 22,
        diaChi: "Tay Ninh",
    },
];

function removeVietnameseDiacritics(str) {
    const accents =
        "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
    const nonAccents =
        "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";

    return str
        .split("")
        .map((char) => {
            const accentIndex = accents.indexOf(char);
            return accentIndex !== -1 ? nonAccents[accentIndex] : char;
        })
        .join("");
}

// let k = removeVietnameseDiacritics(b.ten).toLowerCase();
// a = { ...a, ...{ ten: k } };
// console.log(a);
// for (let item of A) {
//     let k = removeVietnameseDiacritics(item.ten).toLowerCase();
//     item = { ...item, ...{ ten: k } };

// }

let result = A.map((obj) => {
    return {
        ...obj,
        ten: removeVietnameseDiacritics(obj.ten).toLowerCase(),
    };
});
console.log(result);
