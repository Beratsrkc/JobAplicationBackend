import { prisma } from "../lib/db";
import bcrypt from "bcrypt"
import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { handleValidation } from "../utils/helper.js";
import type { AuthAdminRequest } from "../types/auth-admin-request";



const hashToPas = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

const comparePas = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const generateToken = (admin: { id: number }) => {
  return jwt.sign(
    { adminId: Number(admin.id) },
    process.env.JWT_SECRET!,
    { expiresIn: "15d" }
  );
};


export const createAdmin = async (req: AuthAdminRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const isInvalid = handleValidation(req);

    if (isInvalid) {
      return res
        .status(400)
        .json({ ...isInvalid });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Lütfen tüm alanları doldurun" })
    }

    const ExistingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (ExistingEmail) {
      return res.status(400).json({ message: "Bu email kullanımda" });
    }

    const hashedPassword = await hashToPas(password);
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const adminToken = generateToken(admin)

    console.log("adminToken:", adminToken);
    res.status(201).json({
      adminToken,
      admin: {
        id: admin.id,
        email: admin.email,
        password: admin.password,
      },
    })
  } catch (error) {
    res.json(error);
    console.log(error);
  }
};


export const loginAdmin = async (req: AuthAdminRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const isInvalid = handleValidation(req);

    if (isInvalid) {
      return res
        .status(400)
        .json({ ...isInvalid });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Lütfen tüm alanları doldurun" })
    }


    const admin = await prisma.admin.findUnique({
      where: { email }
    });
    if (!admin) {
      return res.status(400).json({ message: "Böyle bir kullanıcı bulunamdı" });
    }

    const isPasswordCorrect = await comparePas(
      password,
      admin.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentaials" });
    }
    const adminToken = generateToken(admin)
    res.status(200).json({
      adminToken,
      admin: {
        id: admin.id,
        email: admin.email,
        password: admin.password,
      }
    })


  } catch (error) {
    console.log(error);
    res.json(error)
  }
}

export const listUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findMany()

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId)
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await prisma.user.delete({
      where: { id: userId }
    })

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export const adminController = {
  createAdmin,
  loginAdmin,
  listUser,
  deleteUser
}