var express = require("express");
var router = express.Router();

/* GET leads listing. */
router.get("/", function (req, res, next) {
  res.status(200).send({ title: "Nishant" });
});

module.exports = router;
