import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/database";

export class AuthService {
  async register(email: string, password: string, name: string) {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email já está em uso");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Criar API Key padrão
    const apiKey = await this.createApiKey(user.id, "Default Key");

    // Gerar JWT Token para login automático
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    return { user, apiKey: apiKey.key, token };
  }

  async login(email: string, password: string) {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Credenciais inválidas");
    }

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    return { user, token };
  }

  async createApiKey(userId: string, name: string) {
    const key = `tia_${uuidv4().replace(/-/g, "")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        userId,
      },
    });

    return apiKey;
  }

  async validateApiKey(key: string) {
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        key,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    return apiKey;
  }

  async getUserApiKeys(userId: string) {
    return await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        key: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async revokeApiKey(keyId: string, userId: string) {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!apiKey) {
      throw new Error("API Key não encontrada");
    }

    return await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }

  // ✅ NOVO: Atualizar perfil do usuário
  async updateUserProfile(userId: string, data: { name?: string }) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // ✅ NOVO: Buscar usuário por ID
  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
