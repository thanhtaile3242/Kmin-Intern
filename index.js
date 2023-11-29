import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.js"; //Router for API user
import mcQuestionRoute from "./routes/mcQuestion.js"; // Router for API multiple choice questions
import challengeRoute from "./routes/challenge.js"; // Router for API challenges
import assignmentRoute from "./routes/assignment.js";
const app = express();
//
app.use(cookieParser());
app.use(express.json());
// Application of API routers
app.use("/api/user", userRoute);
app.use("/api/questions", mcQuestionRoute);
app.use("/api/challenge", challengeRoute);
app.use("/api/assignment", assignmentRoute);

app.listen(8800, () => {
    console.log("Connected the server");
});
