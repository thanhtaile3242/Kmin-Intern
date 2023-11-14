const removeVietnameseDiacritics = (str) => {
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
};

console.log(
    removeVietnameseDiacritics("Đề kiểm tra toán 12 Chương 1 - Đồ thị hàm số")
);
