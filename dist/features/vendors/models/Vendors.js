import mongoose from "mongoose";
const VendorsSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    vendorNo: {
        type: Number,
    },
    name: {
        type: String,
    },
    cName: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    fax: {
        type: String,
    },
    streetAddress: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    zip: {
        type: String,
    },
    country: {
        type: String,
        default: "USA",
    },
    representatives: [
        {
            name: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: false, // Optional if vendor email exists (validated in service layer)
            },
            phone: {
                type: String,
            },
            isActive: {
                type: Boolean,
                default: true,
            },
        },
    ],
    serviceCities: {
        type: String,
    },
    serviceStates: {
        type: String,
    },
    serviceZipCodes: {
        type: String,
    },
    note: {
        type: String,
    },
    products: {
        type: Array,
    },
});
export default mongoose.models.Vendors ||
    mongoose.model("Vendors", VendorsSchema);
//# sourceMappingURL=Vendors.js.map