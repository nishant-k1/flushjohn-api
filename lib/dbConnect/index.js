const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("DB Connected!");
    console.log(`Server running on http://localhost:${process.env.PORT}`);
  } catch (error) {
    console.log("DB Connection Error:", error);
  }
};

module.exports = dbConnect;
