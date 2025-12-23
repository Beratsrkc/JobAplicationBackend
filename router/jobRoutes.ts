import express from "express";
import { authUser, requireRole } from "../middleware/authMiddleware";
import { jobController } from "../controller/jobController";
import { jobValidator } from "../validations/jobValidator";
import { authAdmin } from "../middleware/authAdminMiddleware";

const router = express.Router()

router.get("/", (req, res) => {
    res.send("jobRoutes")
})


router.get("/list", jobController.listJobs)

router.get("/listPagination", jobController.listJobsWithPagination)

router.get("/job/:jobId", jobController.listJobById)

router.get("/listMyJobs", authUser,
    requireRole("EMPLOYER"), jobController.listMyJobs)

router.get("/listMyCompanyJobs/:companyId", jobValidator.validateListMyCompanyJobs(), authUser,
    requireRole("EMPLOYER"), jobController.listMyCompanyJobs)

router.post("/create/:companyId", authUser,
    requireRole("EMPLOYER"), jobValidator.validateCreateJob(), jobController.setJob)

router.delete("/deleteJob/:jobId", authAdmin,
    jobController.deleteJob)

export default router