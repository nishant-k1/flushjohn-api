import { Router } from "express";
import nodemailer from "nodemailer";
import * as contactsService from "../features/contacts/services/contactsService.js";
const router = Router();
router.post("/", async (req, res, next) => {
    try {
        const emailData = req.body;
        // Validate required fields
        if (!emailData.firstName || !emailData.lastName || !emailData.email || !emailData.message) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }
        // Save contact to database
        try {
            await contactsService.createContact({
                firstName: emailData.firstName,
                lastName: emailData.lastName,
                email: emailData.email,
                phone: emailData.phone || "",
                message: emailData.message,
                status: "New",
            });
        }
        catch (dbError) {
            console.error("Error saving contact to database:", dbError);
            // Continue with email even if DB save fails
        }
        const transporter = nodemailer.createTransport({
            host: "smtp.zoho.in",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID,
                pass: process.env.FLUSH_JOHN_EMAIL_PASSWORD,
            },
            tls: { rejectUnauthorized: false },
        });
        await transporter.sendMail({
            from: `Flush John<${process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID}>`,
            to: `Flush John<${process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID}>`,
            subject: "Flush John: Contact Message",
            text: `
        From: ${emailData.firstName} ${emailData.lastName}
        Email: ${emailData.email}
        Phone: ${emailData.phone || "Not provided"}
        Message: ${emailData.message}`,
            html: `
        <h2>Contact Form Submission</h2>
        <p><strong>From:</strong> ${emailData.firstName} ${emailData.lastName}</p>
        <p><strong>Email:</strong> ${emailData.email}</p>
        <p><strong>Phone:</strong> ${emailData.phone || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${emailData.message.replace(/\n/g, "<br>")}</p>
      `,
        });
        return res.status(200).json({
            success: true,
            status: "Success",
            message: "Contact message sent successfully",
        });
    }
    catch (err) {
        console.error("Error sending contact email:", err);
        return res.status(500).json({
            success: false,
            error: "Failed to send email",
            message: err.message || "Internal server error",
        });
    }
});
export default router;
//# sourceMappingURL=contact.js.map