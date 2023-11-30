import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.js"; //Router for API user
import mcQuestionRoute from "./routes/mcQuestion.js"; // Router for API multiple choice questions
import challengeRoute from "./routes/challenge.js"; // Router for API challenges
import assignmentRoute from "./routes/assignment.js"; // Router for API assignments

const PORT = process.env.PORT;
const app = express();
app.use(cookieParser());
app.use(express.json());
dotenv.config({ path: "./.env" });
// Application of API routers
app.use("/api/user", userRoute);
app.use("/api/questions", mcQuestionRoute);
app.use("/api/challenge", challengeRoute);
app.use("/api/assignment", assignmentRoute);

app.listen(PORT, () => {
    console.log(`Connected the server on: ${PORT}`);
});
