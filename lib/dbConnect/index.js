import { connect } from "mongoose";

const dbConnect = async () => {
  try {
    await connect(process.env.MONGO_DB_URI);
    console.log("DB Connected!");
    console.log(`Server running on http://localhost:${process.env.PORT}`);
  } catch (error) {
    console.log("DB Connection Error:", error);
  }
};

export default dbConnect;
