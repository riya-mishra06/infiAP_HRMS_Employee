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
const { authLimiter } = require("../middlewares/security.middleware");

// ===== Public Routes =====
router.post("/signup", authLimiter, registerUser);
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/resend-2fa", authLimiter, resendLoginOTP);
router.post("/verify-2fa", authLimiter, verifyLoginOTP);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh-token", authLimiter, refreshAccessToken);

// ===== Protected Routes =====
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getMe);

module.exports = router;
