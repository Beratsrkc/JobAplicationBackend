import { body } from "express-validator"

export const profileValidator = {

    validateCreateProfile() {
        return [
            body("fullName").notEmpty().withMessage("Ad Soyad Zorunludur"),
            body("location").notEmpty().withMessage("Adres Zorunludur"),
            body("title").notEmpty().withMessage("Meslek Zorunludur"),
            body("phone").notEmpty().withMessage("Telefon Zorunludur"),
        ]
    }

}
