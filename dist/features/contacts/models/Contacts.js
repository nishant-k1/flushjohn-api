import { Schema, model } from "mongoose";
const ContactsSchema = new Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["New", "Read", "Replied", "Archived"],
        default: "New",
    },
    readAt: {
        type: Date,
        default: null,
    },
    repliedAt: {
        type: Date,
        default: null,
    },
});
ContactsSchema.index({ email: 1 });
ContactsSchema.index({ createdAt: -1 });
ContactsSchema.index({ status: 1 });
const Contacts = model("Contacts", ContactsSchema);
export default Contacts;
//# sourceMappingURL=Contacts.js.map