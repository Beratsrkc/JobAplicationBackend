import { body, param } from "express-validator"

export const applicationValidator = {
    validateListMyJobApplication() {
        return [
            param("jobId").notEmpty().withMessage("jobId Zorunludur")
        ]
    },
    validateCreateApplication() {
        return [
            param("jobId").notEmpty().withMessage("jobId Zorunludur")
        ]
    },
    validateUpdateApplication() {
        return [
            param("applicationId").notEmpty().withMessage("applicationId Zorunludur"),
            body("status").notEmpty().withMessage("status Zorunludur"),
        ]
    },
}