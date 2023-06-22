// THIS FILE IS NOT USED ANYWHERE IN THE APP. THIS IS JUST A REFERENCE TO SHOW YOU HOW TO HANDLE CORS ISSUE IN NEXTJS
const Cors = require("cors");

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

module.exports = corsHandler = async (req, res) => {
  await runMiddleware(req, res, cors);
  res.json({ message: "Cors enabled" });
};
