import type { Response } from "express";
import type { AuthRequest } from "../types/auth-request";
import { prisma } from "../lib/db";
import { redis } from "../lib/redis";
import socketService from "../services/socket.service";
import rabbitMQ from "../services/rabbitmq.service";
import { handleValidation } from "../utils/helper";

const listMyApplications = async (req: AuthRequest, res: Response) => {
    try {

        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const cacheKey = `myApplication:${userId}`
        const cached = await redis.get(cacheKey)
        if (cached) {
            console.log("Veri redisten çekildi");
            return res.status(200).json(JSON.parse(cached));
        }


        const applications = await prisma.application.findMany({
            where: {
                userId
            },
            include: {
                job: true
            }
        })

        await redis.setEx(
            cacheKey,
            3600,
            JSON.stringify(applications)

        ).then(() => {
            console.log("Veri redise kayıt edildi");
        })

        res.status(200).json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


const listMyJobApplication = async (req: AuthRequest, res: Response) => {
    try {

        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const jobId = Number(req.params.jobId);

        if (!jobId) {
            return res.status(400).json({ message: "jobId is required" });
        }

        const isInvalid = handleValidation(req);

        if (isInvalid) {
            return res
                .status(400)
                .json({ ...isInvalid });
        }

        const cacheKey = `myJobApplication:${userId}:${jobId}`
        const cached = await redis.get(cacheKey)
        if (cached) {
            console.log("Veri redisten çekildi");
            return res.status(200).json(JSON.parse(cached));
        }

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: {
                company: {
                    select: { ownerId: true }
                }
            }
        })
        if (!job || job.company.ownerId !== userId) {
            return res.status(403).json({
                message: "Bu ilana ait başvuruları görme yetkin yok",
            });
        }
        const applications = await prisma.application.findMany({
            where: { jobId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: true,
                    },
                },
            },
        });

        await redis.setEx(
            cacheKey,
            3600,
            JSON.stringify(applications)

        ).then(() => {
            console.log("Veri redise kayıt edildi");
        })


        res.status(200).json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


const createApplication = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const jobId = Number(req.params.jobId);
        if (!jobId) {
            return res.status(400).json({ message: "jobId is required" });
        }

        const isInvalid = handleValidation(req);

        if (isInvalid) {
            return res
                .status(400)
                .json({ ...isInvalid });
        }

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: {
                company: {
                    select: {
                        id: true,
                        ownerId: true,
                        name: true
                    }
                }
            }
        });

        if (!job) {
            return res.status(404).json({ message: "İş ilanı bulunamadı" });
        }

        const companyOwnerId = job.company.ownerId;

        const applicationValidate = await prisma.application.findFirst({
            where: {
                userId,
                jobId
            }
        });

        if (applicationValidate) {
            return res.status(400).json({ message: "Zaten başvuru bulunuyor" });
        }

        const application = await prisma.application.create({
            data: {
                userId,
                jobId
            },
            include: {
                user: {
                    select: {
                        email: true,
                        profile: true
                    }
                },
                job: {
                    select: {
                        title: true,
                        company: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        socketService.emitToUser(
            job.company.ownerId,
            "applicationCreated",
            {
                applicationId: application.id,
                jobTitle: application.job.title,
            }
        );

        await rabbitMQ.publishEvent("cache.invalidate", {
            keys: [
                `myApplication:${userId}`,
                `myJobApplication:${companyOwnerId}:${jobId}`
            ],
            reason: "application.created"
        });

        res.status(201).json(application);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateApplication = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const applicationId = Number(req.params.applicationId)

        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!applicationId) {
            return res.status(400).json({ message: "Application ID gerekli" });
        }

        if (!status) {
            return res.status(400).json({ message: "Status giriniz" });
        }

        const isInvalid = handleValidation(req);

        if (isInvalid) {
            return res
                .status(400)
                .json({ ...isInvalid });
        }


        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    include: {
                        company: {
                            select: { ownerId: true }
                        }
                    }
                }
            }
        })

        if (!application || application.job.company.ownerId !== userId) {
            return res.status(403).json({
                message: "Bu başvuruyu güncelleme yetkin yok",
            });
        }

        const applicationUser = await prisma.application.findUnique({
            where: { id: applicationId },
            select: {
                userId: true
            }
        })

        const applicationUserId = applicationUser?.userId

        if (!["APPLIED", "REVIEWING", "REJECTED","ACCEPT"].includes(status)) {
            return res.status(400).json({ message: "Geçersiz status" });
        }

        const updated = await prisma.application.update({
            where: { id: applicationId },
            data: { status },
        });

        const jobId = application.jobId;


        socketService.emitToUser(
            application.userId,
            "applicationStatusUpdated",
            {
                applicationId,
                status: updated.status,
                
            }
        )

        await rabbitMQ.publishEvent("cache.invalidate", {
            keys: [
                `myApplication:${applicationUserId}`,
                `myJobApplication:${userId}:${jobId}`
            ],
            reason: "application.updated"
        });


        res.status(200).json(updated);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const applicationController = {
    createApplication,
    listMyApplications,
    listMyJobApplication,
    updateApplication
}