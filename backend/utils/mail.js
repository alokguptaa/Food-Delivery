import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

transporter.verify((error, success) => {
    if (error) {
        console.log("VERIFY ERROR:", error);
    } else {
        console.log("SMTP SERVER READY");
    }
});

console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

export const sendOtpMail = async (to, otp) => {
    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject: "Reset Your Password",
        html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    });
};

export const sendDeliveryOtpMail = async (user, otp) => {
    console.log("MAIL-1");
    console.log("TO:", user.email);

    try {
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Delivery OTP",
            html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
        });

        console.log("MAIL-2");
    } catch (error) {
        console.log("MAIL ERROR:", error);
        throw error;
    }
};

