import jwt from "jsonwebtoken";
import type { Response, NextFunction } from "express";
import { prisma } from "../lib/db";
import type { Role } from "../generated/prisma/enums";
import type { AuthRequest } from "../types/auth-request";
import type { JwtPayload } from "jsonwebtoken";

interface JwtUserPayload extends JwtPayload {
    userId: number;
}
export const authUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token bulunamadı" });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new Error("token tanımlı değil");
        }
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtUserPayload

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(401).json({ message: "Token geçersiz" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({ message: "Token geçersiz" });
    }
};

export const requireRole =
    (role: Role) =>
        (req: AuthRequest, res: Response, next: NextFunction) => {
            if (req.user?.role !== role) {
                return res.status(403).json({ message: "Yetkisiz" });
            }
            next();
        };
