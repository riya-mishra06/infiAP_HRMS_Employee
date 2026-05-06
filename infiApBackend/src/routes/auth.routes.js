const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    resendLoginOTP,
    forgotPassword,
    resetPassword,
    verifyLoginOTP,
    refreshAccessToken,
    logout,
    getMe
} = require("../controllers/auth.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

// ===== Public Routes =====
router.post("/signup", registerUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/resend-2fa", resendLoginOTP);
router.post("/verify-2fa", verifyLoginOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshAccessToken);

// ===== Protected Routes =====
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getMe);

module.exports = router;
