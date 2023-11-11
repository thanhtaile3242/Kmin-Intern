import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
// Controller for API create MCQ
export const handleCreateMCQ = async (req, res) => {
    try {
        // Get all information sent from the client
        const userID = req.userId;
        const listQuestion = req.body;
        // The loop for inserting the list of questions
        for (const question of listQuestion) {
            const { name, descriptionQ } = question;
            // Create uuid for each question (Also use for answers of this question)
            const uuidQuestion = uuidv4();
            // Insert each question into question table
            const queryQuestion = `INSERT INTO question (\`uid\`,\`account_uid\`,\`question_type_id\`,\`name\`,\`description\`) VALUES ('${uuidQuestion}', UUID_TO_BIN('${userID}'),'1','${name}','${descriptionQ}')`;
            await db.execute(queryQuestion);
            // Insert each answer into answer table
            for (const answer of question.answers) {
                const { order_answer, description, correct } = answer;
                const uuidAnswer = uuidv4();
                const queryAnswer = `INSERT INTO answer (\`uid\`,\`mc_question_uid\`,\`order_answer\`,\`description\`,\`correct\`) 
                VALUES ('${uuidAnswer}', '${uuidQuestion}','${order_answer}','${description}','${correct}')`;
                await db.execute(queryAnswer);
            }
        }
        res.status(201).json({ message: "Questions created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}; //
// Controller for API delete MCQ (soft-delete)
export const handleDeleteMCQ = async (req, res) => {
    const question_uid = req.body.question_uid.trim();

    // Prepare the queries using placeholders for parameters
    const queryDeleteQ = `UPDATE question SET is_deleted = 1 WHERE uid = '${question_uid}'`;
    const queryDeleteA = `UPDATE answer SET is_deleted = 1 WHERE mc_question_uid = '${question_uid}'`;

    try {
        // Start a transaction
        await db.beginTransaction();

        // Soft-delete the question using a parameterized query
        await db.execute(queryDeleteQ);

        // Soft-delete the answers associated with the question using a parameterized query
        await db.execute(queryDeleteA);

        // Commit the transaction
        await db.commit();

        // If both operations are successful, send a success response
        return res
            .status(200)
            .json({ message: "User soft-deleted successfully." });
    } catch (err) {
        // If there's an error, rollback the transaction
        await db.rollback();
        console.error(err);
        // Send an error response
        return res.status(500).json({ error: "Error soft-deleting user" });
    }
}; //

// Controller for API update MCQ
export const handleUpdateMCQ = async (req, res) => {
    const newQuestion = req.body[0];
    const question_uid = newQuestion.question_uid;

    try {
        // Update question
        const query = `UPDATE question SET name = '${newQuestion.name}', description = '${newQuestion.descriptionQ}' WHERE uid = '${newQuestion.question_uid}'`;
        await db.execute(query);
        // Update answer
        const query1 = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}' and is_deleted = '0'`;
        // Get lists of answers from newData and currentData
        const [currentAnswersList] = await db.execute(query1); //From database
        let newAnswersList = newQuestion.answers; // From client-side

        // Get list of uuid from newAnswersList and currentAnswersList
        const uuidOfNewList = new Set(newAnswersList.map((item) => item.uid));
        const uuidOfCurrentList = new Set(
            currentAnswersList.map((item) => item.uid)
        );
        // Trường hợp 1: newAnswersList > currentAnswersList
        if (newAnswersList.length > currentAnswersList.length) {
            const NotHavingUid = newAnswersList.filter(
                (item) => !uuidOfCurrentList.has(item.uid)
            );
            const havingUid = newAnswersList.filter((item) =>
                uuidOfCurrentList.has(item.uid)
            );
            let newUidAnswers = NotHavingUid.map((obj) => ({
                ...obj,
                uid: uuidv4(),
            }));
            newAnswersList = [...havingUid, ...newUidAnswers];
            for (const newAnswer of newAnswersList) {
                const query2 = `
                REPLACE INTO answer (\`mc_question_uid\`,\`uid\`,\`description\`, \`correct\`,\`order_answer\`)
                VALUES ('${question_uid}', '${newAnswer.uid}', '${newAnswer.description}','${newAnswer.correct}','${newAnswer.order_answer}')
              `;
                await db.execute(query2);
            }
            return res
                .status(200)
                .json({ message: "Answers updated and new answers added." });
        }
        // Trường hợp 2: newAnswerList < currentAnswerList
        if (newAnswersList.length < currentAnswersList.length) {
            const deletedAnswersList = currentAnswersList.filter(
                (item) => !uuidOfNewList.has(item.uid)
            );

            for (const newAnswer of newAnswersList) {
                const query3 = `UPDATE answer SET order_answer = '${newAnswer.order_answer}', description = '${newAnswer.description}', correct = '${newAnswer.correct}' WHERE uid = '${newAnswer.uid}'`;
                await db.execute(query3);
            }

            for (const deletedAnswer of deletedAnswersList) {
                const query4 = `UPDATE answer SET is_deleted = 1 WHERE uid = '${deletedAnswer.uid}'`;
                await db.execute(query4);
            }
            return res.status(200).json({
                message:
                    "Answers updated and surplus answers marked as deleted.",
            });
        }
        // Trường hợp 3: newAnswerList = currentAnswerList
        if (newAnswersList.length === currentAnswersList.length) {
            for (const newAnswer of newAnswersList) {
                const query5 = `UPDATE answer SET order_answer = '${newAnswer.order_answer}', description = '${newAnswer.description}', correct = '${newAnswer.correct}' WHERE uid = '${newAnswer.uid}'`;
                await db.execute(query5);
            }
            return res.status(200).json({ message: "Answers updated." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "An error occurred while updating answers.",
            error: error.message,
        });
    }
};
