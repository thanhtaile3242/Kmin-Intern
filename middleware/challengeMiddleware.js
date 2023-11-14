import db from "../models/db.js";

// Check challenge existent
export const checkChallengeExistent = async (req, res, next) => {
    try {
        const challenge_uid = req.params.id;
        const userId = req.userId;
        const query = `SELECT * FROM challenge WHERE uid = '${challenge_uid}' AND creator_uid = UUID_TO_BIN('${userId}') AND is_deleted = '0'`;
        const [result, fields] = await db.execute(query);
        if (result.length != 0) {
            req.data = result[0];
            next();
        } else {
            return res.status(401).json({ error: "Challenge is not existent" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
