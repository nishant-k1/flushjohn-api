import Notes from "../models/Notes.js";

export const findByUserId = async (userId) => {
  try {
    const notes = await Notes.findOne({ userId })
      .populate("userId", "name email")
      .lean();
    return notes;
  } catch (error) {
    console.error("Error finding notes by user ID:", error);
    throw error;
  }
};

export const create = async (data) => {
  try {
    const notes = new Notes(data);
    await notes.save();
    return notes;
  } catch (error) {
    console.error("Error creating notes:", error);
    throw error;
  }
};

export const updateByUserId = async (userId, content) => {
  try {
    const notes = await Notes.findOneAndUpdate(
      { userId },
      { content, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    return notes;
  } catch (error) {
    console.error("Error updating notes:", error);
    throw error;
  }
};

export const deleteByUserId = async (userId) => {
  try {
    await Notes.findOneAndDelete({ userId });
    return { success: true };
  } catch (error) {
    console.error("Error deleting notes:", error);
    throw error;
  }
};
