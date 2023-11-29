import nodemailer from "nodemailer";
export const sendMail = async (email, html) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "thanhtaile3242@gmail.com",
            pass: "oagtbtqgzvkshqhe",
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
