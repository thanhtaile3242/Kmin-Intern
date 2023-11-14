import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";

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
        const challenge_uid = req.data.uid;
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
