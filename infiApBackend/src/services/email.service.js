const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const RESEND_API_URL = process.env.RESEND_API_URL || "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "InfiAP HRMS <onboarding@resend.dev>";

const isConfiguredForEmail = () => {
    // Check SMTP
    const smtpConfigured = process.env.SMTP_USER && 
                          process.env.SMTP_PASS && 
                          !process.env.SMTP_USER.includes('your_email');
    
    if (smtpConfigured) return true;

    // Check Resend
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
        return false;
    }

    const placeholderValues = [apiKey, fromEmail].some((value) =>
        typeof value === "string" &&
        (value.includes("your_resend") || value.includes("example.com"))
    );

    return !placeholderValues;
};

// Create Nodemailer Transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendEmail = async ({ to, subject, html }) => {
    if (!isConfiguredForEmail()) {
        logger.warn("Email service not configured. Skipping email delivery.");
        return false;
    }

    // Try SMTP first if configured
    const smtpConfigured = process.env.SMTP_USER && 
                          process.env.SMTP_PASS && 
                          !process.env.SMTP_USER.includes('your_email');

    if (smtpConfigured) {
        try {
            const transporter = createTransporter();
            const info = await transporter.sendMail({
                from: `InfiAP HRMS <${process.env.SMTP_USER}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html,
            });
            logger.info("Email sent via SMTP", { messageId: info.messageId });
            return true;
        } catch (error) {
            logger.error("SMTP Error", { error: error.message });
            // Fallback to Resend
        }
    }

    // Resend Primary/Fallback
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && !resendApiKey.includes('your_resend')) {
        // Try with configured from address first
        const fromOptions = [
            process.env.RESEND_FROM_EMAIL,
            "onboarding@resend.dev" // Fallback for unverified domains
        ].filter(Boolean);

        for (const from of fromOptions) {
            try {
                const response = await fetch(RESEND_API_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${resendApiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: from.includes('<') ? from : `InfiAP HRMS <${from}>`,
                        to: Array.isArray(to) ? to : [to],
                        subject,
                        html,
                    }),
                });

                if (response.ok) {
                    logger.info(`Email sent via Resend using sender: ${from}`);
                    return true;
                } else {
                    const errorText = await response.text();
                    logger.warn(`Resend failed with ${from}: ${errorText}`);
                    // Continue to next from option (onboarding@resend.dev)
                }
            } catch (error) {
                logger.error("Resend Fetch Error", { error: error.message });
            }
        }
    }

    return false;
};

const sendVerificationEmail = async (email, token) => {
    try {
        const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
        const emailSent = await sendEmail({
            to: email,
            subject: "Verify Your Email - InfiAP HRMS",
            html: `
                <h1>Email Verification</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <p>This link will expire in 24 hours.</p>
            `,
        });

        if (emailSent) {
            logger.info("Verification email sent", { email });
        }

        return emailSent;
    } catch (error) {
        logger.error("Error sending verification email", { error: error.message });
        throw new Error("Could not send verification email");
    }
};

const sendLoginOTPEmail = async (email, otp) => {
    try {
        const emailSent = await sendEmail({
            to: email,
            subject: "Your InfiAP login verification code",
            html: `
                <h1>Secure Login Code</h1>
                <p>Your 6-digit verification code is:</p>
                <h2 style="letter-spacing: 4px;">${otp}</h2>
                <p>This code will expire in 10 minutes.</p>
            `,
        });

        if (emailSent) {
            logger.info("Login OTP email sent", { email });
        }

        return emailSent;
    } catch (error) {
        logger.error("Error sending login OTP email", { error: error.message });
        throw new Error("Could not send login OTP email");
    }
};

const sendPasswordResetEmail = async (email, token, origin) => {
    try {
        // Construct the base URL intelligently
        let clientBaseUrl = 'http://localhost:5173'; // Default fallback
        
        if (origin) {
            clientBaseUrl = origin;
        } else if (process.env.CLIENT_URL) {
            const urls = process.env.CLIENT_URL.split(',').map(u => u.trim());
            // In dev, prefer localhost if it's in the list
            if (process.env.NODE_ENV !== 'production') {
                const localUrl = urls.find(u => u.includes('localhost') || u.includes('127.0.0.1'));
                clientBaseUrl = localUrl || urls[0];
            } else {
                clientBaseUrl = urls[0];
            }
        }

        const resetLink = `${clientBaseUrl}/confirm-reset?token=${token}`;
        
        const emailSent = await sendEmail({
            to: email,
            subject: "Reset Your Password - InfiAP HRMS",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #6c5ce7; font-size: 28px; font-weight: 800; margin: 0;">InfiAP HRMS</h1>
                    </div>
                    <div style="background-color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #edf2f7;">
                        <h2 style="color: #1a202c; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Reset Request</h2>
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                            We received a request to reset the password for your account associated with <strong>${email}</strong>.
                        </p>
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${resetLink}" style="display: inline-block; background-color: #6c5ce7; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 6px rgba(108, 92, 231, 0.2);">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
                            This link will expire in 1 hour. If you did not request a password reset, please ignore this email.
                        </p>
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                            <p style="color: #a0aec0; font-size: 12px; margin-bottom: 8px;">
                                If you're having trouble clicking the button, copy and paste the URL below into your web browser:
                            </p>
                            <p style="color: #6c5ce7; font-size: 12px; word-break: break-all;">
                                ${resetLink}
                            </p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px;">
                        <p style="color: #a0aec0; font-size: 12px;">© ${new Date().getFullYear()} InfiAP Tech Solutions. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        if (emailSent) {
            logger.info("Password reset email sent successfully", { email });
        } else {
            logger.warn("Password reset email failed to send (service returned false)", { email });
            // In dev, log the link to console if email sending failed/not configured
            console.log("\n--- PASSWORD RESET LINK (LOCAL FALLBACK) ---");
            console.log(`To: ${email}`);
            console.log(`Link: ${resetLink}`);
            console.log("-------------------------------------------\n");
        }

        return emailSent;
    } catch (error) {
        logger.error("Error in sendPasswordResetEmail", { error: error.message, email });
        return false;
    }
};

const sendBookingConfirmationEmail = async (email, name, date) => {
    try {
        await sendEmail({
            to: email,
            subject: "Meeting Request Received - InfiAP HRMS",
            html: `
                <h1>Meeting Request Received</h1>
                <p>Hi ${name},</p>
                <p>We have received your request for a meeting on <strong>${new Date(date).toLocaleString()}</strong>.</p>
                <p>Our team will review it and send you a Google Meet link shortly.</p>
                <br>
                <p>Best Regards,<br>AbhiProject Team</p>
            `,
        });
        logger.info("Booking confirmation email sent", { email });
    } catch (error) {
        logger.error("Error sending booking email", { error: error.message });
    }
};

const sendMeetingLinkEmail = async (email, name, date, link) => {
    try {
        await sendEmail({
            to: email,
            subject: "Meeting Confirmed - InfiAP HRMS",
            html: `
                <h1>Meeting Confirmed</h1>
                <p>Hi ${name},</p>
                <p>Your meeting has been confirmed for <strong>${new Date(date).toLocaleString()}</strong>.</p>
                <p>You can join using the link below:</p>
                <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Join Google Meet</a>
                <p>Or copy this link: ${link}</p>
                <br>
                <p>Best Regards,<br>AbhiProject Team</p>
            `,
        });
        logger.info("Meeting link email sent", { email });
    } catch (error) {
        logger.error("Error sending meeting link email", { error: error.message });
    }
};

module.exports = {
    sendVerificationEmail,
    sendLoginOTPEmail,
    sendPasswordResetEmail,
    sendBookingConfirmationEmail,
    sendMeetingLinkEmail,
    isConfiguredForEmail,
};