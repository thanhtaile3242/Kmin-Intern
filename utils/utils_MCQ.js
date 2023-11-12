// Remove Vietnamese Diacritics
export const removeVietnameseDiacritics = (str) => {
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
// Generate SQL Collate query
export const generateCollateQuery = (keyword) => {
    const keywords = keyword.split(" ");

    const conditionClauses = keywords
        .map((kw) => `full_name COLLATE utf8mb4_unicode_ci LIKE '%${kw}%'`)
        .join(" AND ");

    const sqlQuery = `
        SELECT uid, description, name, full_name
        FROM (
            SELECT uid, description, name, CONCAT(name, " ", description) AS full_name
            FROM question
            WHERE is_deleted = "0"
        ) AS subquery
        WHERE ${conditionClauses};
    `;

    return sqlQuery;
};
// Count matching score
export const countMatching = (keyWord, Target) => {
    // Tách chuỗi thành mảng
    const a = keyWord.split(" ");
    const b = Target.split(" ");

    // Xử lý thuật toán trên mảng
    const lenA = a.length;
    const lenB = b.length;
    let count = 0;
    // Bắt cặp từ một phần tử ở mảng a với một phần tử ở mảng b
    for (let i = 0; i < lenA; i++) {
        for (let j = 0; j < lenB; j++) {
            if (a[i] == b[j])
                // Nếu 2 phần tử giống nhau thì tăng đếm
                count++;
        }
    }
    return count;
};
// Remove special characters
export const removeSpecialCharactersAndTrim = (inputString) => {
    // Define a regular expression to match special characters
    const regex = /[.,\/?\\$£@#!%^&*;:{}=\-+_`~()]/g;

    // Use the replace method to remove special characters from the input string
    const resultString = inputString.replace(regex, "");

    // Use the trim method to remove leading and trailing whitespace
    const trimmedString = resultString.trim();

    return trimmedString;
};
