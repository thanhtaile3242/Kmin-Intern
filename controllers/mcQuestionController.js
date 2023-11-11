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

// Controller for updating a question
// export const handleUpdateMCQ = (req, res) => {
// try {
//     const question_uid = req.question_uid;
//     const payload = req.body[0];

//     // question table
//     const { name, descriptionQ } = payload;
//     const queryQ = `UPDATE question SET name = '${name}', description = '${descriptionQ}' WHERE uid = '${question_uid}'`;
//     db.execute(queryQ);

//     // answer table
//     const queryA1 = `DELETE FROM answer WHERE mc_question_uid = '${question_uid}'`;
//     db.execute(queryA1, () => {
//         const { answers } = payload;
//         for (const answer of answers) {
//             const { order_answer, description, correct } = answer;
//             const insertSql = `INSERT INTO answer (\`mc_question_uid\`, \`uid\`, \`description\`, \`correct\`, \`order_answer\` ) VALUES ('${question_uid}', UUID(), '${description}', '${correct}', '${order_answer}')`;
//             db.execute(insertSql);
//         }
//         res.status(200).json({ message: "Question updated successfully" });
//     });
// } catch (error) {
//     console.error("Error updating question:", error);
//     res.status(500).json({ error: "Internal Server Error" });
// }
//     const question_uid = req.question_uid;
//     const query = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}'`;
//     db.execute(query, (error, result) => {
//         if (error) {
//             return res.send("Lỗi 123");
//         }
//         const newList = req.body[0].answers;
//         newList.forEach((newAnswer) => {
//             // Use REPLACE INTO to update or insert data into the answer table
//             const sql = `
//               REPLACE INTO answer (\`mc_question_uid\`,\`uid\`,\`description\`, \`correct\`,\`order_answer\`)
//               VALUES ('${question_uid}', '${newAnswer.uid}', '${newAnswer.description}','${newAnswer.correct}','${newAnswer.order_answer}')
//             `;

//             db.execute(sql);
//         });
//     });
// };

// Demo 1
// export const handleUpdateMCQ = (req, res) => {
//     const question_uid = req.question_uid;
//     const query = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}'`;
//     db.execute(query, (error, result) => {
//         if (error) {
//             return res.status(500).send("LỖI");
//         }
//         // Get newList (client send) and currentList (database)
//         const newList = req.body[0].answers;
//         const currentList = result;
//         // Get the not-existent answers (uid) ...
//         const uniqueIds = new Set(newList.map((item) => item.uid));
//         const DeletedList = currentList.filter(
//             (item) => !uniqueIds.has(item.uid)
//         ); // (for delete)

//         let completedOperations = 0;
//         newList.forEach((newAnswer) => {
//             const sql = `
//           REPLACE INTO answer (\`mc_question_uid\`,\`uid\`,\`description\`, \`correct\`,\`order_answer\`)
//           VALUES ('${question_uid}', '${newAnswer.uid}', '${newAnswer.description}','${newAnswer.correct}','${newAnswer.order_answer}')
//         `;
//             db.execute(sql, (error, result) => {
//                 completedOperations++;
//                 if (error) {
//                     // Handle the error if needed, but don't send the response here
//                 }
//                 // Check if all operations are completed before sending the response
//                 if (completedOperations === newList.length) {
//                     if (DeletedList.length != 0) {
//                         // Xóa các answer tồn tại trong database nhưng không tồn tại trong client data
//                         let completedOperations2 = 0;
//                         DeletedList.forEach((answerDelete) => {
//                             const sql2 = `DELETE FROM answer WHERE uid = '${answerDelete.uid}'`;
//                             db.execute(sql2, (error, result) => {
//                                 completedOperations2++;
//                                 if (error) {
//                                 }
//                                 if (
//                                     completedOperations2 == DeletedList.length
//                                 ) {
//                                     return res.send("OK1!!!");
//                                 }
//                             });
//                         });
//                     } else {
//                         return res.send("OK2!!!");
//                     }
//                 }
//             });
//         });
//         res.send("AAAAAA");
//     });
// };
// Demo 2
export const handleUpdateMCQ = async (req, res) => {
    const question_uid = req.question_uid;
    const query = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}'`;
    db.execute(query, (error, result) => {
        if (error) {
            return res.status(500).send("LỖI");
        }
        // Get the one newList (client send) and currentList (database)
        const newList = req.body[0].answers;
        const currentList = result;
        // Get the not-existent answers (uid) ...
        const uniqueIds = new Set(newList.map((item) => item.uid));
        const DeletedList = currentList.filter(
            (item) => !uniqueIds.has(item.uid)
        ); // (for delete)
        const notUIDList = newList.filter((item) => item.uid == "");
        // if (notUIDList.length != 0) {
        // }
        notUIDList.map((item) => (item.uid = uuidv4()));

        newList = [...newList, ...notUIDList];
        console.log(newList);
        let completedOperations = 0;
        newList.forEach((newAnswer) => {
            const sql = `
          REPLACE INTO answer (\`mc_question_uid\`,\`uid\`,\`description\`, \`correct\`,\`order_answer\`)
          VALUES ('${question_uid}', '${newAnswer.uid}', '${newAnswer.description}','${newAnswer.correct}','${newAnswer.order_answer}')
        `;
            db.execute(sql, (error, result) => {
                completedOperations++;
                if (error) {
                    // Handle the error if needed, but don't send the response here
                }
                // Check if all operations are completed before sending the response
                if (completedOperations === newList.length) {
                    if (DeletedList.length != 0) {
                        // Xóa các answer tồn tại trong database nhưng không tồn tại trong client data
                        let completedOperations2 = 0;
                        DeletedList.forEach((answerDelete) => {
                            const sql2 = `DELETE FROM answer WHERE uid = '${answerDelete.uid}'`;
                            db.execute(sql2, (error, result) => {
                                completedOperations2++;
                                if (error) {
                                }
                                if (
                                    completedOperations2 == DeletedList.length
                                ) {
                                    return res.send("OK1!!!");
                                }
                            });
                        });
                    } else {
                        return res.send("OK2!!!");
                    }
                }
            });
        });
    });
};

// // Assuming you have required the mysql2 library
export const handleUpdateMCQ2 = async (req, res) => {
    const newQuestion = req.body[0];
    // get current list from database (question_uid = 2a795f09-0ef4-4022-983e-39be59e534d3)
    const question_uid = newQuestion.question_uid;

    try {
        const query1 = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}' and is_deleted = '0'`;
        const [result1, field1] = await db.execute(query1);

        // Get list of answers from newData and currentData
        const currentAnswersList = [...result1];
        let newAnswersList = newQuestion.answers;

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
            const HavingUid = newAnswersList.filter((item) =>
                uuidOfCurrentList.has(item.uid)
            );
            let a = NotHavingUid.map((obj) => ({
                ...obj,
                uid: uuidv4(),
            }));
            newAnswersList = [...HavingUid, ...a];
            for (const newAnswer of newAnswersList) {
                const query2 = `
                REPLACE INTO answer (\`mc_question_uid\`,\`uid\`,\`description\`, \`correct\`,\`order_answer\`)
                VALUES ('${question_uid}', '${newAnswer.uid}', '${newAnswer.description}','${newAnswer.correct}','${newAnswer.order_answer}')
              `;
                const [result, field] = await db.execute(query2);
            }
        }
        // Trường hợp 2: newAnswerList < currentAnswerList
        if (newAnswersList.length < currentAnswersList.length) {
            const deletedAnswersList = currentAnswersList.filter(
                (item) => !uuidOfNewList.has(item.uid)
            );

            try {
                for (const newAnswer of newAnswersList) {
                    const query3 = `UPDATE answer SET order_answer = '${newAnswer.order_answer}', description = '${newAnswer.description}', correct = '${newAnswer.correct}' WHERE uid = '${newAnswer.uid}'`;
                    await db.execute(query3);
                }

                for (const deletedAnswer of deletedAnswersList) {
                    const query4 = `UPDATE answer SET is_deleted = 1 WHERE uid = '${deletedAnswer.uid}'`;
                    const [result, field] = await db.execute(query4);
                }
            } catch (error) {}
        }
        // Trường hợp 3: newAnswerList = currentAnswerList
        if (newAnswersList.length == currentAnswersList.length) {
            for (const newAnswer of newAnswersList) {
                const query5 = `UPDATE answer SET order_answer = '${newAnswer.order_answer}', description = '${newAnswer.description}', correct = '${newAnswer.correct}' WHERE uid = '${newAnswer.uid}'`;
                await db.execute(query5);
            }
        }
    } catch (error) {
        console.log(error);
    }
};
