import { body } from "express-validator"

export const userValidator = {

    validateRegister() {
        return [
            body("email").notEmpty().isEmail().withMessage("Email boş olamaz"),
            body("password").notEmpty().withMessage("Password boş olamaz"),
            body("password")
                .isLength({ min: 8, max: 20 })
                .withMessage("Şifre min:8 max:20 karakterden oluşmalıdır"),
            body("role").notEmpty().withMessage("Role belirtmek zorunludur")
        ]
    },
    validateLogin() {
        return [
            body("email").notEmpty().isEmail().withMessage("Email boş olamaz"),
            body("password").notEmpty().withMessage("Password boş olamaz"),
            body("password")
                .isLength({ min: 8, max: 20 })
                .withMessage("Şifre min:8 max:20 karakterden oluşmalıdır"),
        ]
    },
}