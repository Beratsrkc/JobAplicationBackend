import { body, param } from "express-validator"

export const jobValidator = {
    validateListMyCompanyJobs() {
        return [
            param("companyId").notEmpty().withMessage("companyId Zorunludur")
        ]
    },
    validateCreateJob() {
        return [
            param("companyId").notEmpty().withMessage("companyId Zorunludur"),
            body("title").notEmpty().withMessage("title Zorunludur"),
            body("description").notEmpty().withMessage("description Zorunludur"),
            body("location").notEmpty().withMessage("location Zorunludur"),
            body("jobType").notEmpty().withMessage("jobType Zorunludur"),
        ]
    },
}