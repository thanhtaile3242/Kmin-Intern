import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
// Controller for creating a list of questions
export const handleCreateMCQ = (req, res) => {
    try {
        // Get all information be sent from client
        const userID = req.userId;
        const listQuestion = req.body;
        // The loop for inserting the list of questions
        for (const question of listQuestion) {
            const { name, descriptionQ } = question;
            // Create uuid for each question (Also use for answers of this question)
            const uuidQuestion = uuidv4();
            // Insert each answer into answer table
            for (const answer of question.answers) {
                const { order_answer, descriptionA, correct } = answer;
                const queryAnswer = `INSERT INTO answer (\`uid\`,\`mc_question_uid\`,\`order_answer\`,\`description\`,\`correct\`) VALUES (UUID(), '${uuidQuestion}','${order_answer}','${descriptionA}','${correct}')`;
                db.query(queryAnswer);
            }
            // Insert each question into question table
            const queryQuestion = `INSERT INTO question (\`uid\`,\`account_uid\`,\`question_type_id\`,\`name\`,\`description\`) VALUES ('${uuidQuestion}', UUID_TO_BIN('${userID}'),'1','${name}','${descriptionQ}')`;
            db.query(queryQuestion);
        }
        res.status(201).json({ message: "Questions created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
// Controller for deleting a question (Soft-delete)
export const handleDeleteMCQ = (req, res) => {
    const question_uid = req.body.question_uid.trim();
    const querryDeleteQ = `UPDATE question SET \`is_deleted\` = 1 WHERE \`uid\` = '${question_uid}'`;
    db.query(querryDeleteQ);
    const querryDeleteA = `UPDATE answer SET \`is_deleted\` = 1 WHERE \`mc_question_uid\` = '${question_uid}'`;
    db.query(querryDeleteA, (err, result) => {
        if (err) {
            return res.status(401).json({ error: "Error soft-deleting user" });
        } else {
            return res
                .status(200)
                .json({ message: "User soft-deleted successfully." });
        }
    });
};
