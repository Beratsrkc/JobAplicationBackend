import express from "express"
import { applicationController } from "../controller/applicationController"
import { authUser, requireRole } from "../middleware/authMiddleware"
import { applicationValidator } from "../validations/applicationValidator"

const router = express.Router()

router.get("/", (req, res) => {
    res.send("applicationRouter")
})

//router.get("/list", authAdmin,applicationController.listApplication)
router.get("/listMyApplications", authUser, requireRole("CANDIDATE"), applicationController.listMyApplications)
router.get("/listMyJobs/:jobId", authUser, requireRole("EMPLOYER"),applicationValidator.validateListMyJobApplication(), applicationController.listMyJobApplication)
router.post("/create/:jobId", authUser, requireRole("CANDIDATE"),applicationValidator.validateCreateApplication(), applicationController.createApplication)
router.put("/update/:applicationId", authUser, requireRole("EMPLOYER"),applicationValidator.validateUpdateApplication(), applicationController.updateApplication)

export default router