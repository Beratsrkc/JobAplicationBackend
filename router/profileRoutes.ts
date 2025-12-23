import express from "express"
import { profileController } from "../controller/profileController";
import { authUser, requireRole } from "../middleware/authMiddleware";
import { profileValidator } from "../validations/profileValidator";

const router = express.Router()

router.get("/", (req, res) => {
    res.send("authRoutes");
});

router.get("/get", authUser, requireRole("CANDIDATE"), profileController.getProfile)
router.post("/set", authUser, requireRole("CANDIDATE"), profileValidator.validateCreateProfile(), profileController.setProfile)

export default router