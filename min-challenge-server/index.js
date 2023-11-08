import express from "express"
import authRoute from "./routes/auth.js"
import userRoute from "./routes/user.js" //Api for user service
import mcQuestionRoute from "./routes/mcQuestion.js"

const app = express()

app.use(express.json())
app.use("/api/auth", authRoute)
app.use("/api/user", userRoute) // Declare the route of user Api
app.use("/api/questions", mcQuestionRoute ) //Declare the route for multiple choice questions

app.listen(8800, () => {
    console.log("Connected the server")
})