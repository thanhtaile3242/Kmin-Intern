function countMatching(keyWord, Target) {
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
}
//
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
//
let books = [
    {
        uid: "f076ae4f-2d7d-414c-a173-e97d86d3760e",
        description: "giới thiệu Các kiểu biến giá trị",
        name: "Javascript cơ bản 1 bài tập",
        full_name:
            "javascript co ban 1 bai tap gioi thieu cac kieu bien gia tri",
    },
    {
        uid: "546433c2-f491-4b4a-99ad-3c6b6fc91dab",
        description: "Giới thiệu Khí hậu Châu Âu và địa trung hải",
        name: "Trắc nghiệm địa lý 12 bài tập",
        full_name:
            "trac nghiem dia ly 12 bai tap gioi thieu khi hau chau âu va dia trung hai tap tap gioi",
    },
    {
        uid: "7f300664-d6cc-4097-b479-e863b9150c9d",
        description: "Các hash password bài thiệu",
        name: "Quy tắc chuyển đổi số giới tập",
        full_name:
            "quy tac chuyen doi so gioi tap cac hash password bai thieu bai",
    },
    {
        uid: "35c7c397-07ea-472d-a077-1c7172a20c56",
        description: "Giới thiệu MongoDB",
        name: "Dữ liệu No-SQL tập bài",
        full_name:
            "du lieu no-sql tap bai gioi thieu mongodb chua bai tap gioi thieu thieu gioi",
    },
    {
        uid: "ad3457ae-b1bd-4946-8911-c908ce6b1a8a",
        description: " bài tập hữu cơ",
        name: "Hoá học 10 - chương 7 giới thiệu",
        full_name: "hoa hoc 10 - chuong 7 gioi thieu bai tap huu co",
    },
];
let keyword = "bai tap gioi thieu";

let filterList = [];
let scores = [];

for (let book of books) {
    const fullName = removeVietnameseDiacritics(book.full_name).toLowerCase();
    const score = countMatching(keyword, fullName); // Điểm là số lần mà có một từ trong keyword khớp một từ trong bookName
    // Nếu keywrod gần giống với bookName thì thêm phần tử vào mảng
    if (score > 0) {
        scores.push(score);
        filterList.push(book);
    }
}

// const A = [12, 1, 5, 6, 2, 9, 7];
// const B = [
//     { letter: "A", name: "hehe1" },
//     { letter: "T", name: "hehe12" },
//     { letter: "Y", name: "hehe133" },
//     { letter: "M", name: "hehe1aa" },
//     { letter: "J", name: "hehe1" },
//     { letter: "U", name: "hehe1" },
//     { letter: "I", name: "hehe1" },
// ];

// Combine arrays A and B into an array of objects for easy sorting
const combinedArray = scores.map((value, index) => ({
    score: value,
    letterObject: books[index],
}));

// Sort the combined array in descending order based on the 'value' property
combinedArray.sort((a, b) => b.score - a.score);

combinedArray.forEach((item) => {
    delete item.score;
});
// console.log(combinedArray);

let transformedArray = combinedArray.map((item) => item.letterObject);
// console.log(transformedArray);

function generateSQLQuery(keyword) {
    const keywords = keyword.split(" ");

    const conditionClauses = keywords
        .map((kw) => `full_name COLLATE utf8mb4_unicode_ci LIKE '%${kw}%'`)
        .join(" AND ");

    const sqlQuery = `
        SELECT uid, description, name, full_name
        FROM (
            SELECT uid, description, name, CONCAT(name, " ", description) AS full_name
            FROM question
        ) AS subquery
        WHERE ${conditionClauses};
    `;

    return sqlQuery;
}

// Example usage:
const queryString = generateSQLQuery("gioi thieu bai tap toan 12 dia 10");
console.log(queryString);
