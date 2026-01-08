import { Router } from "express";
import * as notesService from "../services/notesService.js";
import { authenticateToken } from "../../auth/middleware/auth.js";

const router: any = Router();

// Get user's notes
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await notesService.getUserNotes(userId);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving notes",
      error: error.message,
    });
  }
});

// Save user's notes
router.post("/save", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (content === undefined) {
      res.status(400).json({
        success: false,
        message: "Content is required",
      });
      return;
    }

    const notes = await notesService.saveUserNotes(userId, content);

    res.json({
      success: true,
      data: notes,
      message: "Notes saved successfully",
    });
  } catch (error) {
    console.error("Error saving notes:", error);
    res.status(500).json({
      success: false,
      message: "Error saving notes",
      error: error.message,
    });
  }
});

// Delete user's notes
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notesService.deleteUserNotes(userId);

    res.json({
      success: true,
      message: "Notes deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting notes:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notes",
      error: error.message,
    });
  }
});

export default router;
