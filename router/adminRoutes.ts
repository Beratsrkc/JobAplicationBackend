import express from "express";
import { adminController } from "../controller/adminController";
import { adminValidator } from "../validations/adminValidator";
import { authAdmin } from "../middleware/authAdminMiddleware";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("autAdminhRoutes");
});

router.post("/create", authAdmin, adminValidator.validateRegister(), adminController.createAdmin);
router.post("/login", adminValidator.validateLogin(), adminController.loginAdmin);
router.get("/getUsers", authAdmin, adminController.listUser);
router.delete("/deleteUsers/:userId", authAdmin, adminController.deleteUser);

export default router;
