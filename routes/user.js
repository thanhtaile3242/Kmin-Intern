import express from "express";
const router = express.Router();
// Middleware
import * as userMiddleware from "../middleware/userMiddleware.js";
import * as commonMiddleware from "../middleware/commonMiddleware.js";
// Controller
import * as userController from "../controllers/userController.js";

// API sign up
router.post(
    "/signup",
    [userMiddleware.validateUserSignUp],
    userController.handleSignUp
);
// API sign in
router.post(
    "/signin",
    [userMiddleware.validateUserSignIn],
    userController.handleSignIn
);
// API get a user via access_token
router.get(
    "/account",
    commonMiddleware.authentication,
    userController.handleGetAccount
);
// API refresh access_token and refresh_token (when access_token expired)
router.get("/refresh", userController.handleRefreshToken);
// API log out
router.post(
    "/logout",
    commonMiddleware.authentication,
    userController.handleLogOut
);
// API forget password
router.post("/forget", userController.handleForgetPassword);
// API check link of reset password valid or not
router.get("/:resetPasswordToken", userController.handleValidateLinkReset);
// API reset password from client
router.put("/reset-password", userController.handleResetPassword);

export default router;
