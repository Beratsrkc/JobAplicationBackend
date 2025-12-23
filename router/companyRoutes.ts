import express from "express"
import { authUser, requireRole } from "../middleware/authMiddleware";
import { companyController } from "../controller/companyController";
import { companyValidator } from "../validations/companyValidator";

const router = express.Router()

router.get("/", authUser,
    requireRole("EMPLOYER"), (req, res) => {
        res.send("companyRoutes");
    });
router.get("/list", authUser,
    requireRole("EMPLOYER"), companyController.listComany)
router.post("/create", authUser,
    requireRole("EMPLOYER"),companyValidator.validateCreateCompany() ,companyController.setCompany)
router.put("/update/:id", authUser,
    requireRole("EMPLOYER"),companyValidator.validateUpdateCompany(), companyController.updateCompany)
router.delete("/delete/:id", authUser,
    requireRole("EMPLOYER"),companyValidator.validateDeleteCompany(), companyController.deleteCompany)

export default router