import { Router } from "express";
const router = Router();
/* GET home page. */
router.get("/", function (req, res, next) {
    res.status(200).send({ title: "Flush John API" });
});
export default router;
//# sourceMappingURL=index.js.map