import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config({ path: "../.env" });
export const sendMail = async (email, html) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.ADMINEMAIL,
            pass: process.env.PASSWORDEMAIL,
        },
    });

    const info = await transporter.sendMail({
        from: '"Min_Challenge" <kmin.edu@example.com>', // sender address
        to: email,
        subject: "Forget Password", // Subject line
        html: html, // html body
    });

    return info;
};
