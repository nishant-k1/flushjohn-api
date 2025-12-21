import salesAssistRouter from "./routes/salesAssist.js";
import speechRecognitionRouter from "./routes/speechRecognition.js";

export default {
  routes: {
    salesAssist: salesAssistRouter,
    speechRecognition: speechRecognitionRouter,
  },
};
