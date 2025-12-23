import { body, param } from "express-validator";

export const companyValidator = {

    validateCreateCompany() {
        return [
            body("name").notEmpty().withMessage("Şirket Adı Zorunldur"),
            body("description").notEmpty().withMessage("Şirket Açıklaması Zorunldur")
        ]
    },
    validateUpdateCompany() {
        return [
            param("id").notEmpty().withMessage("CompanyId Zorunldur")
        ]
    },
    validateDeleteCompany() {
        return [
            param("id").notEmpty().withMessage("CompanyId Zorunldur")
        ]
    }
}