const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("DB Connected! and running on Port: 3000");
  } catch (error) {
    console.log("DB Connection Error:", error);
  }
};

module.exports = dbConnect;
