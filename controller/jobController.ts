import type { Response } from "express";
import { prisma } from "../lib/db";
import type { AuthRequest } from "../types/auth-request";
import { redis } from "../lib/redis";
import socketService from "../services/socket.service";
import rabbitMQ from "../services/rabbitmq.service";
import { handleValidation } from "../utils/helper";

const listJobs = async (req: AuthRequest, res: Response) => {
  try {

    const cacheKey = "jobs:all"

    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log("Veri redisten çekildi");
      return res.status(200).json(JSON.parse(cached));
    }

    const jobs = await prisma.job.findMany({ include: { company: true } })

    await redis.setEx(
      cacheKey,
      3600,
      JSON.stringify(jobs)

    ).then(() => {
      console.log("Veri redise kayıt edildi");
    })

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}


const listJobsWithPagination = async (req: AuthRequest, res: Response) => {
  try {
    const {
      perPage = 10,
      page = 1,
      search = '',
      location = '',
      jobType = ''
    } = req.query;

    const take = Number(perPage);
    const skip = (Number(page) - 1) * Number(perPage);

    // Filtreleme koşulları
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    if (jobType) {
      where.jobType = jobType;
    }

    // Toplam sayı
    const total = await prisma.job.count({ where });

    // İşleri getir
    const jobs = await prisma.job.findMany({
      where,
      include: { 
        company: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            ownerId: true
          }
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      jobs,
      pagination: {
        page: Number(page),
        perPage: Number(perPage),
        total,
        totalPages: Math.ceil(total / Number(perPage))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const listJobById = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = Number(req.params.jobId)
    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }


    const jobs = await prisma.job.findFirst({
      where: { id: jobId },
      include: { company: true }
    })


    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const listMyJobs = async (req: AuthRequest, res: Response) => {
  try {

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cacheKey = `listMyJobs:${userId}`

    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log("Veri redisten çekildi");
      return res.status(200).json(JSON.parse(cached));
    }

    const jobs = await prisma.job.findMany({
      where: {
        company: {
          ownerId: userId,
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await redis.setEx(
      cacheKey,
      3600,
      JSON.stringify(jobs)

    ).then(() => {
      console.log("Veri redise kayıt edildi");
    })

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const listMyCompanyJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const companyId = Number(req.params.companyId)
    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const isInvalid = handleValidation(req);

    if (isInvalid) {
      return res
        .status(400)
        .json({ ...isInvalid });
    }

    const cacheKey = `listMyCompanyJobs:${userId}:${companyId}`

    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log("Veri redisten çekildi");
      return res.status(200).json(JSON.parse(cached))
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        ownerId: true
      }
    })

    if (!company || company.ownerId !== userId) {
      return res.status(403).json({
        message: "Bu şirkete ait işleri görme yetkin yok",
      });
    }

    const jobs = await prisma.job.findMany({
      where: { companyId },
    })

    await redis.setEx(
      cacheKey,
      3600,
      JSON.stringify(jobs)
    ).then(() => { console.log("Veri redise kayıt edildi"); })

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}


const setJob = async (req: AuthRequest, res: Response) => {
  try {

    const userId = req.user?.id;
    const companyId = Number(req.params.companyId);
    const { title, description, location, jobType } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!companyId) {
      return res.status(400).json({ message: "Company ID gerekli" });
    }

    const isInvalid = handleValidation(req);

    if (isInvalid) {
      return res
        .status(400)
        .json({ ...isInvalid });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(403).json({
        message: "Bu şirkete job ekleme yetkin yok",
      });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        jobType,
        companyId
      }
    })

    socketService.emitToAll("job.created", {
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      createdAt: job.createdAt
    })

    await rabbitMQ.publishEvent("job.create", {
      reason: "job_created",
      keys: [
        `jobs:all`,
        `listMyJobs:${userId}`,
        `listMyCompanyJobs:${userId}:${companyId}`
      ],
      jobId: job.id
    });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = req.user?.id;
    
    if (!jobId) {
      return res.status(400).json({ message: "Job ID gerekli" });
    }

    // Önce işi bulalım (companyId'yi öğrenmek için)
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ message: "İş bulunamadı" });
    }

    // İşi sil
    const deletedJob = await prisma.job.delete({
      where: { id: jobId }
    });

    // Cache'i temizle
    await rabbitMQ.publishEvent("job.delete", {
      reason: "job_deleted",
      keys: [
        `jobs:all`,
        `job:${jobId}`,
        `myjobs:${userId}`,
        `companyjobs:${job.companyId}`,
        `applications:job:${jobId}`,   
        `myApplication:*`,       
        `myJobApplication:*`,           
        `listMyJobs:*`,            
      ],
      jobId: deletedJob.id,
      companyId: job.companyId,
      deletedBy: userId
    });

    res.status(200).json({ 
      success: true, 
      message: "İş başarıyla silindi",
      data: deletedJob 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export const jobController = {
  setJob,
  listJobs,
  listJobById,
  listMyJobs,
  listJobsWithPagination,
  deleteJob,
  listMyCompanyJobs
}