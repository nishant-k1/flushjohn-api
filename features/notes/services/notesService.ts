import * as notesRepository from "../repositories/notesRepository.js";

export const getUserNotes = async (userId) => {
  try {
    const notes = await notesRepository.findByUserId(userId);

    if (!notes) {
      // Create default notes if none exist
      return await notesRepository.create({
        userId,
        content: "",
      });
    }

    return notes;
  } catch (error) {
    console.error("Error getting user notes:", error);
    throw error;
  }
};

export const saveUserNotes = async (userId, content) => {
  try {
    const notes = await notesRepository.updateByUserId(userId, content);
    return notes;
  } catch (error) {
    console.error("Error saving user notes:", error);
    throw error;
  }
};

export const deleteUserNotes = async (userId) => {
  try {
    const result = await notesRepository.deleteByUserId(userId);
    return result;
  } catch (error) {
    console.error("Error deleting user notes:", error);
    throw error;
  }
};
