import { prisma } from "../lib/db.js";
import bcrypt from "bcrypt"
import type { Response } from "express";
import jwt from "jsonwebtoken"
import type { AuthRequest } from "../types/auth-request.js";
import { handleValidation } from "../utils/helper.js";

type JwtUser = {
  id: number | string
  role: string
}

const hashToPas = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

const comparePas = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const generateToken = (user: JwtUser): string => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15d" }
  )
}

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role } = req.body;

    const isInvalid = handleValidation(req);

    if (isInvalid) {
      return res
        .status(400)
        .json({ ...isInvalid });
    }

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Lütfen tüm alanları doldurun" })
    }

    const ExistingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (ExistingEmail) {
      return res.status(400).json({ message: "Bu email kullanımda" });
    }

    const hashedPassword = await hashToPas(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role
      },
    });

    const token = generateToken(user)

    console.log("token:", token);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        password: user.password,
        role: user.role,
      },
      socketInfo: {
        shouldJoinRoom: true,
        userId: user.id
      }
    })
  } catch (error) {
    res.json(error);
    console.log(error);
  }
};


export const loginUser = async (req: AuthRequest, res: Response) => {
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


    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(400).json({ message: "Böyle bir kullanıcı bulunamdı" });
    }

    const isPasswordCorrect = await comparePas(
      password,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentaials" });
    }
    const token = generateToken(user)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        password: user.password,
        role: user.role,
      },
      socketInfo: {
        shouldJoinRoom: true,
        userId: user.id
      }
    })


  } catch (error) {
    console.log(error);
    res.json(error)
  }
}

export const userController = {
  createUser,
  loginUser
}