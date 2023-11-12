import express from "express";
import db from "../models/db.js";
const router = express.Router();
import {
    checkValidToken,
    checkEmptyMCQ,
    checkQuestionExistent,
} from "../middleware/mcQuestionMiddleware.js";
import {
    handleCreateMCQ,
    handleDeleteMCQ,
    handleUpdateMCQ,
} from "../controllers/mcQuestionController.js";

// API create Multiple choice question
router.post(
    "/create-multiple-choice",
    [checkValidToken, checkEmptyMCQ],
    handleCreateMCQ
);
// API delete a question (soft-delete)
router.delete(
    "/delete",
    [checkValidToken, checkQuestionExistent],
    handleDeleteMCQ
);
// API update a question
router.put("/edit", [checkValidToken, checkEmptyMCQ], handleUpdateMCQ);
// API test
router.get("/test", async (req, res) => {
    // Remove Vietnamese Diacritics
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
    // Generate SQL query
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
    // Count matching score
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

    // Handle keyword
    let keyWord = req.body.keyword;
    keyWord = removeVietnameseDiacritics(keyWord).toLowerCase();

    //
    const q = generateSQLQuery(keyWord);

    let [result, field] = await db.execute(q);
    // Transform result
    result = result.map((obj) => {
        return {
            ...obj,
            full_name: removeVietnameseDiacritics(obj.full_name).toLowerCase(),
        };
    });
    // Filter
    let filterList = [];
    let scores = [];
    for (let item of result) {
        const fullName = item.full_name;

        const score = countMatching(keyWord, fullName);
        // Nếu keywrod gần giống với bookName thì thêm phần tử vào mảng
        if (score > 0) {
            scores.push(score);
            filterList.push(item);
        }
    }
    // Sort
    const combinedArray = scores.map((value, index) => ({
        score: value,
        question: filterList[index],
    }));
    // Sort the combined array in descending order based on the 'value' property
    combinedArray.sort((a, b) => b.score - a.score);
    combinedArray.forEach((item) => {
        delete item.score;
    });
    // console.log(combinedArray);

    let finalList = combinedArray.map((item) => item.question);
    finalList.forEach((item) => {
        delete item.full_name;
    });
    res.json(finalList);
});

export default router;
