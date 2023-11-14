import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";

// CController for API create a challenge
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
