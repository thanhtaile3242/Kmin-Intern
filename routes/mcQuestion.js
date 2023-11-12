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
    // Handle keyword
    let keyWord = req.body.keyword;
    keyWord = keyWord.toLowerCase();
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
    keyWord = removeVietnameseDiacritics(keyWord);

    //
    const query = `SELECT uid, description, name, full_name
    FROM (
        SELECT uid, description, name, CONCAT(name, " ", description) AS full_name
        FROM question
    ) AS subquery
    WHERE full_name COLLATE utf8mb4_unicode_ci LIKE '%gioi%'
        AND full_name COLLATE utf8mb4_unicode_ci LIKE '%thieu%'
        AND full_name COLLATE utf8mb4_unicode_ci LIKE '%bai%'
        AND full_name COLLATE utf8mb4_unicode_ci LIKE '%tap%';`;

    let [result, field] = await db.execute(query);

    let result2 = result.map((obj) => {
        return {
            ...obj,
            full_name: removeVietnameseDiacritics(obj.full_name).toLowerCase(),
        };
    });

    console.log(result2);
    res.send("test view");
});

export default router;
