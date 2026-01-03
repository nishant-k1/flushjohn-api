import { Router, Request, Response, NextFunction } from "express";

const router = Router();

/* GET home page. */
router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.status(200).send({ title: "Flush John API" });
});

export default router;
