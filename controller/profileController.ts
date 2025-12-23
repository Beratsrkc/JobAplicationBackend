import type { Response } from "express";
import { prisma } from "../lib/db";
import type { AuthRequest } from "../types/auth-request";
import { redis } from "../lib/redis";
import rabbitMQ from "../services/rabbitmq.service";
import { handleValidation } from "../utils/helper";

const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const cacheKey = `profile:${userId}`
        const cached = await redis.get(cacheKey)
        if (cached) {
            console.log("Veri redisten çekildi");
            return res.status(200).json(JSON.parse(cached))
        }

        const profile = await prisma.profile.findFirst({
            where: { userId },
        });

        await redis.setEx(
            cacheKey,
            3600,
            JSON.stringify(profile)
        ).then(() => {
            console.log("Veri redise kayıt edildi");
        })

        res.status(201).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const setProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // DEBUG: Gelen verileri logla
        console.log("Gelen body:", req.body);
        
        const { fullName, bio, location, title, phone, website } = req.body;

        // DEBUG: Alanları kontrol et
        console.log("Alanlar:");
        console.log("- fullName:", fullName);
        console.log("- title:", title);
        console.log("- phone:", phone, "(uzunluk:", phone?.length, ")");
        console.log("- location:", location);
        console.log("- bio:", bio?.substring(0, 50) + "...");
        console.log("- website:", website);

        const isInvalid = handleValidation(req);
        
        if (isInvalid) {
            return res.status(400).json({ ...isInvalid });
        }

        if (!fullName) {
            return res.status(400).json({ message: "fullName is required" });
        }

        // Phone validation
        if (phone && phone.length > 0) {
            // Sadece rakam ve boşluk kontrolü
            
            // Eğer location rakam içeriyorsa ve phone metin içeriyorsa, swap et
            if (/^\d+$/.test(location?.replace(/\s/g, '') || '') && 
                /^[a-zA-Z\s]+$/.test(phone || '')) {
                console.log("⚠ UYARI: phone ve location alanları ters görünüyor!");
                console.log("Orijinal - phone:", phone, "location:", location);
                
                // Alanları düzelt
                const correctedPhone = location;
                const correctedLocation = phone;
                
                console.log("Düzeltilmiş - phone:", correctedPhone, "location:", correctedLocation);
                
                const profile = await prisma.profile.upsert({
                    where: { userId },
                    update: {
                        fullName,
                        title,
                        phone: correctedPhone,      // Düzeltilmiş telefon
                        location: correctedLocation, // Düzeltilmiş lokasyon
                        bio,
                    },
                    create: {
                        userId,
                        fullName,
                        title,
                        phone: correctedPhone,
                        location: correctedLocation,
                        bio,
                    },
                });

                await rabbitMQ.publishEvent("cache.invalidate", {
                    keys: [`profile:${userId}`],
                    reason: "profile_created"
                });

                return res.status(201).json(profile);
            }
        }

        const profile = await prisma.profile.upsert({
            where: { userId },
            update: {
                fullName,
                title,
                phone,      // Orjinal telefon
                location,   // Orjinal lokasyon
                bio,
            },
            create: {
                userId,
                fullName,
                title,
                phone,
                location,
                bio,
            },
        });

        await rabbitMQ.publishEvent("cache.invalidate", {
            keys: [`profile:${userId}`],
            reason: "profile_created"
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const profileController = {
    setProfile,
    getProfile
};