const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  password: {
    type: String,
  },
  fName: {
    type: String,
  },
  lName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
