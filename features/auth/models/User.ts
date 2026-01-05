import mongoose from "mongoose";
import argon2 from "argon2";
import { getCurrentDateTime } from "../../../lib/dayjs.js";

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      unique: true,
      trim: true,
      minlength: [3, "User ID must be at least 3 characters long"],
      maxlength: [50, "User ID cannot exceed 50 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      maxlength: [128, "Password cannot exceed 128 characters"],
      select: false, // Don't include password in queries by default
    },
    fName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"],
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "user"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password; // Never include password in JSON output
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await argon2.hash(this.password);
    this.passwordChangedAt = getCurrentDateTime().toDate();
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch {
    return false;
  }
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

UserSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { failedLoginAttempts: 1 },
    });
  }

  const updates: { $inc: { failedLoginAttempts: number }; $set?: { lockUntil: Date } } = { $inc: { failedLoginAttempts: 1 } };

  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }

  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { lockUntil: 1, failedLoginAttempts: 1 },
  });
};

UserSchema.methods.updateLastLogin = function () {
  return this.updateOne({ lastLogin: getCurrentDateTime().toDate() });
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      (this.passwordChangedAt as Date).getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

UserSchema.virtual("fullName").get(function () {
  return `${this.fName} ${this.lName}`;
});

// userId and email: unique: true already creates indexes automatically
UserSchema.index({ isActive: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
