import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";

export const handleCreateAssignment = async (req, res) => {
    const userId = req.userId;
    const data = req.body[0];
    const { name, description, is_public, challenges } = data;
    const assignment_uid = uuidv4();

    try {
        await db.beginTransaction();

        // assignment table
        const queryAssign = `INSERT INTO assignment (\`uid\`, \`creator_uid\`, \`name\`, \`description\`, \`is_public\`) 
        VALUES ('${assignment_uid}', UUID_TO_BIN('${userId}'), '${name}', '${description}', '${is_public}')`;
        await db.execute(queryAssign);

        // assignment detail table
        for (const challenge of challenges) {
            const { challenge_uid } = challenge;
            const queryAD = `INSERT INTO assignment_detail (\`challenge_uid\`, \`assignment_uid\`) VALUES ('${challenge_uid}', '${assignment_uid}')`;
            await db.execute(queryAD);
        }

        await db.commit();

        return res.status(200).json({
            status: "Success",
            message: "Assignment created successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error creating challenge:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to create assignment",
        });
    }
};
