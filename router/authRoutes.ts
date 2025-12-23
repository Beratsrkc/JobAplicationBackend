import express from "express";
import { userController } from "../controller/userController";
import { userValidator } from "../validations/userValidator";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("authRoutes");
});

router.post("/create", userValidator.validateRegister(), userController.createUser);
router.post("/login", userValidator.validateLogin(), userController.loginUser);

export default router;
