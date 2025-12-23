import type { Response } from "express";
import type { AuthRequest } from "../types/auth-request";
import { prisma } from "../lib/db";
import { redis } from "../lib/redis";
import rabbitmqService from "../services/rabbitmq.service";
import { handleValidation } from "../utils/helper";

const listComany = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const cacheKey = `company:${userId}`

        const cached = await redis.get(cacheKey)
        if (cached) {
            console.log("Veri redisten çekildi");
            return res.status(200).json(JSON.parse(cached));
        }

        const company = await prisma.company.findMany({
            where: {
                ownerId: userId
            }
        })

        await redis.setEx(
            cacheKey,
            3600,
            JSON.stringify(company)
        ).then(() => {
            console.log("Veri redise kayıt edildi");
        })

        res.status(200).json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const setCompany = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user?.id;

        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { name, description } = req.body;

        const isInvalid = handleValidation(req);

        if (isInvalid) {
            return res
                .status(400)
                .json({ ...isInvalid });
        }

        const companyName = await prisma.company.findUnique({
            where: { name }
        })

        if (companyName) {
            return res.status(400).json({ message: "Bu şirket Adı kullanımda" });
        }

        const company = await prisma.company.create({
            data: {
                ownerId,
                name,
                description,
            }
        })

        await rabbitmqService.publishEvent("cache.invalidate", {
            keys: [`company:${ownerId}`],
            reason: "company_created"
        });

        res.status(201).json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateCompany = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user?.id;
        const companyId = Number(req.params.id);

        const isInvalid = handleValidation(req);

        if (isInvalid) {
            return res
                .status(400)
                .json({ ...isInvalid });
        }

        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!companyId) {
            return res.status(400).json({ message: "Geçersiz company id" });
        }

        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                ownerId,
            },
        });

        if (!company) {
            return res.status(403).json({
                message: "Bu şirketi güncelleme yetkin yok",
            });
        }

        const updated = await prisma.company.update({
            where: { id: companyId },
            data: req.body,
        });


        await rabbitmqService.publishEvent("cache.invalidate", {
            keys: [`company:${ownerId}`],
            reason: "company_updated"
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteCompany = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user?.id;
        const companyId = Number(req.params.id);

        const isInvalid = handleValidation(req);

        if (isInvalid) {
            return res
                .status(400)
                .json({ ...isInvalid });
        }

        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!companyId) {
            return res.status(400).json({ message: "Geçersiz company id" });
        }

        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                ownerId,
            },
        });

        if (!company) {
            return res.status(403).json({
                message: "Bu şirketi güncelleme yetkin yok",
            });
        }

        const updated = await prisma.company.delete({
            where: { id: companyId }
        });

        await rabbitmqService.publishEvent("cache.invalidate", {
            keys: [`company:${ownerId}`],
            reason: "company_deleted"
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const companyController = {
    setCompany,
    updateCompany,
    deleteCompany,
    listComany
};
