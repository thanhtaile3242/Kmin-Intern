import db from "../models/db.js";

// Check challenge existent
export const checkAssignmentExistent = async (req, res, next) => {
    try {
        const assignment_uid = req.params?.id;
        const userId = req?.userId;
        const query = `SELECT * FROM assignment WHERE uid = '${assignment_uid}' AND creator_uid = UUID_TO_BIN('${userId}') AND is_deleted = '0'`;
        const [result, fields] = await db.execute(query);
        if (result?.length != 0) {
            req.data = result[0];
            next();
        } else {
            return res.status(401).json({
                status: "fail",
                message: "Assignment is not existent",
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal server error: ${error.message}`,
        });
    }
};
