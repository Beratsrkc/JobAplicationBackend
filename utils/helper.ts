import type { Request } from "express";
import { validationResult } from "express-validator";

export const handleValidation = (req:Request) => {
    const validationErrors = validationResult(req);
    if (validationErrors.isEmpty() === false) {
        return {
            message: "Geçersiz veri",
            success: false,
            validationErrors: validationErrors.array(),
            error: true,
            timestamp: Date.now(),
            code: 400,
        };
    }
    return null;
};

