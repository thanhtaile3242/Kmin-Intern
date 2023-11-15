import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilterChallenge,
    removeSpecialCharactersAndTrim,
    countMatching,
} from "../utils/utils_MCQ.js";

// Controller for API create a challenge
export const handleCreateChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const data = req.body[0];
        const { name, description, minute, questions } = data;
        // challenge table
        const challenge_uid = uuidv4();
        const query1 = `INSERT INTO challenge (\`uid\`, \`creator_uid\`, \`name\`, \`description\`, \`minute\`)
        VALUES ('${challenge_uid}', UUID_TO_BIN('${userId}'), '${name}', '${description}', '${minute}')`;
        await db.execute(query1);
        // challenge-detail table
        for (const question of questions) {
            const { question_uid } = question;
            const query2 = `INSERT INTO challenge_detail (\`challenge_uid\`, \`question_uid\`) VALUES ('${challenge_uid}', '${question_uid}')`;
            await db.execute(query2);
        }
        // If everything is successful, send a success response
        res.status(200).json({
            success: true,
            message: "Challenge created successfully.",
        });
    } catch (error) {
        console.error("Error creating challenge:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error: Unable to create challenge.",
        });
    }
};
// Controller for API delete a challenge
export const handleDeleteChallenge = async (req, res) => {
    try {
        await db.beginTransaction();
        // Get data
        const userId = req.userId;
        const challenge_uid = req.data.uid || req.body.uid;
        // challenge table
        const queryDeleteC = `UPDATE challenge SET is_deleted = 1 WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${challenge_uid}'`;
        await db.execute(queryDeleteC);
        // challenge_detail table
        const queryDeleteCD = `UPDATE challenge_detail SET is_deleted = 1 WHERE challenge_uid = '${challenge_uid}'`;
        await db.execute(queryDeleteCD);
        //
        await db.commit();
        res.status(200).json({
            success: true,
            message: "Challenge deleted successfully.",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error deleting challenge:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error: Unable to delete challenge.",
        });
    }
};
// Controller for API search and filter challenges
export const handleSearchAndFilterChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const page = req.query.page;
        const limit = req.query.limit;
        let keyword = req.query.keyword;
        let sortOrder = ["asc", "desc"].includes(req.query.sortOrder)
            ? req.query.sortOrder
            : "";
        let sortField = ["name", "created_at"].includes(req.query.sortField)
            ? req.query.sortField
            : "";
        let query = `SELECT uid, description, name ,CONCAT(name, " ", description) AS full_name
        FROM challenge WHERE creator_uid = UUID_TO_BIN('${userId}') AND is_deleted = '0'`;
        //
        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }
        //
        if (keyword) {
            keyword = removeSpecialCharactersAndTrim(keyword);
            keyword = removeVietnameseDiacritics(keyword);
            query = generateQuerySearchFilterChallenge(keyword, query);
        }
        //
        if (limit && page) {
            const offset = (page - 1) * limit;
            query += ` limit ${limit} offset ${offset}`;
        }
        //Get challenge
        let [currentList, field] = await db.execute(query);
        // Get Questions and Answers
        for (let i = 0; i < currentList.length; i++) {
            const challenge_uid = currentList[i].uid;
            const queryQ = `select q.uid ,q.name, q.description from challenge_detail cd join question q on cd.question_uid = q.uid where cd.challenge_uid = '${challenge_uid}'`;
            const [questions] = await db.execute(queryQ);
            currentList[i].questions = questions;
            for (let k = 0; k < currentList[i].questions.length; k++) {
                const mc_question_uid = currentList[i].questions[k].uid;
                const queryA = `SELECT uid, description, correct FROM answer WHERE mc_question_uid = '${mc_question_uid}'AND is_deleted = '0'`;
                const [answers] = await db.execute(queryA);
                currentList[i].questions[k].answers = answers;
            }
        }
        // Ranking by keyword
        if (keyword) {
            currentList = currentList.map((obj) => {
                return {
                    ...obj,
                    full_name: removeVietnameseDiacritics(
                        obj.full_name
                    ).toLowerCase(),
                };
            });
            // Filter and Ranking the order of the questions in result
            // First step
            let filterList = [];
            let scores = [];

            for (let item of currentList) {
                const fullName = item.full_name;
                const score = countMatching(keyword, fullName);

                // If the keyword is similar to fullName, add the item to the array
                if (score > 0) {
                    scores.push(score);
                    filterList.push(item);
                }
            }

            // Second step
            const combinedArray = scores.map((value, index) => ({
                score: value,
                question: filterList[index],
            }));

            combinedArray.sort((a, b) => b.score - a.score);
            combinedArray.forEach((item) => {
                delete item.score;
            });

            // Get the final list
            currentList = combinedArray.map((item) => item.question);
        }
        currentList.forEach((item) => {
            delete item.full_name;
        });

        res.status(200).json({
            data: currentList,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
        });
    }
};
// Controller for API update a challenge
export const handleUpdateChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const challenge_uid = req.params.id || req.body.uid;
        const newChallenge = req.body[0];
        const newQuestions = newChallenge.questions;

        // Update information of a challenge
        const { name, description, minute } = newChallenge;
        const query = `UPDATE challenge SET name = '${name}', description = '${description}', minute = '${minute}'
        WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${challenge_uid}'`;
        await db.execute(query);

        // Delete all old questions in a challenge
        const query1 = `DELETE FROM challenge_detail WHERE challenge_uid = '${challenge_uid}'`;
        await db.execute(query1);

        // Insert all new questions in a challenge
        for (const question of newQuestions) {
            const { question_uid } = question;
            const query2 = `INSERT INTO challenge_detail (\`challenge_uid\`, \`question_uid\`)
            VALUES ('${challenge_uid}', '${question_uid}')`;
            await db.execute(query2);
        }

        res.status(200).json({ message: "Challenge updated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Error updating challenge",
            error: error.message,
        });
    }
};
// Controller for API detail one challenge and its questions
export const handleDetailOneChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const challenge_uid = req.params.id;

        // Get a challenge
        const queryC = `SELECT uid, description, name 
            FROM challenge WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${challenge_uid}' AND is_deleted = '0'`;
        const [resultC] = await db.execute(queryC);

        if (resultC.length === 0) {
            return res.status(404).json({ error: "Challenge not found" });
        }

        // Get questions
        const queryQ = `select q.uid ,q.name, q.description from challenge_detail cd join question q on cd.question_uid = q.uid where cd.challenge_uid = '${challenge_uid}'`;
        const [resultQ] = await db.execute(queryQ);
        resultC[0].questions = resultQ;

        // Get answers
        for (let i = 0; i < resultQ.length; i++) {
            const mc_question_uid = resultC[0].questions[i].uid;
            const queryA = `SELECT uid, description, correct FROM answer WHERE mc_question_uid = '${mc_question_uid}'AND is_deleted = '0'`;
            const [resultA] = await db.execute(queryA);
            resultC[0].questions[i].answers = resultA;
        }

        res.json(resultC[0]);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
