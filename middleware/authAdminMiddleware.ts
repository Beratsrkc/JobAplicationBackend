import jwt from "jsonwebtoken";
import type { Response, NextFunction } from "express";
import { prisma } from "../lib/db";
import type { AuthAdminRequest } from "../types/auth-admin-request";
import type { JwtPayload } from "jsonwebtoken";

interface JwtAdminPayload extends JwtPayload {
    adminId: number;
}
export const authAdmin = async (
    req: AuthAdminRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "adminToken bulunamadı" });
        }

        const adminToken = authHeader.split(" ")[1];

        if (!adminToken) {
            throw new Error("adminToken tanımlı değil");
        }
        const decoded = jwt.verify(
            adminToken,
            process.env.JWT_SECRET!
        ) as JwtAdminPayload;
        const adminId = Number(decoded.adminId);
        if (!adminId) {
            return res.status(401).json({ message: "adminId token içinde yok" });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });


        if (!admin) {
            return res.status(401).json({ message: "adminToken geçersiz" });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({ message: "adminToken geçersiz" });
    }
};
