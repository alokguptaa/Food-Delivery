import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const sendMail = async (to, subject, html) => {
    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "Food Delivery",
                    email: process.env.SENDER_EMAIL,
                },
                to: [
                    {
                        email: to,
                    },
                ],
                subject,
                htmlContent: html,
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error(
            "BREVO ERROR:",
            error.response?.data || error.message
        );
        throw error;
    }
};

export const sendOtpMail = async (to, otp) => {
    await sendMail(
        to,
        "Reset Your Password",
        `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );
};

export const sendDeliveryOtpMail = async (user, otp) => {
    await sendMail(
        user.email,
        "Delivery OTP",
        `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );
};

