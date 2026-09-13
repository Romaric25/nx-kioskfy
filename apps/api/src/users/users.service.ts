import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { users, verifications, accounts } from "../db/auth-schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Database } from "../db";
import type { CreatePartnershipDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async getAll() {
    return this.db.query.users.findMany({ orderBy: (u, { desc }) => [desc(u.createdAt)] });
  }

  async getById(id: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    return user;
  }

  async createPartnership(dto: CreatePartnershipDto) {
    if (dto.password !== dto.confirmPassword) throw new BadRequestException("Les mots de passe ne correspondent pas");

    const [emailExists, phoneExists] = await Promise.all([
      this.db.query.users.findFirst({ where: eq(users.email, dto.email) }),
      this.db.query.users.findFirst({ where: eq(users.phone, dto.phone) }),
    ]);
    if (emailExists) throw new ConflictException("Email déjà utilisé");
    if (phoneExists) throw new ConflictException("Téléphone déjà utilisé");

    const id = randomUUID();
    await this.db.insert(users).values({
      id, name: dto.name, lastName: dto.lastName, email: dto.email,
      phone: dto.phone, typeUser: dto.typeUser || "agency", isActive: false, emailVerified: false,
    });

    await this.db.delete(verifications).where(eq(verifications.identifier, dto.email));
    const token = randomUUID();
    await this.db.insert(verifications).values({
      id: randomUUID(), identifier: dto.email, value: token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return { id, token };
  }

  async verifyEmail(token: string) {
    const verification = await this.db.query.verifications.findFirst({
      where: eq(verifications.value, token),
    });
    if (!verification) throw new NotFoundException("Token invalide");
    if (new Date(verification.expiresAt) < new Date()) throw new BadRequestException("Token expiré");

    await this.db.update(users).set({ isActive: true, emailVerified: true }).where(eq(users.email, verification.identifier));
    await this.db.delete(verifications).where(eq(verifications.id, verification.id));
  }

  async resendToken(input: { email?: string; token?: string }) {
    let email = input.email;
    if (!email && input.token) {
      const verification = await this.db.query.verifications.findFirst({ where: eq(verifications.value, input.token) });
      if (verification) email = verification.identifier;
    }
    if (!email) throw new BadRequestException("Email ou token requis");

    const user = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    if (user.emailVerified) throw new BadRequestException("Email déjà vérifié");

    await this.db.delete(verifications).where(eq(verifications.identifier, email));
    const newToken = randomUUID();
    await this.db.insert(verifications).values({
      id: randomUUID(), identifier: email, value: newToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return { token: newToken };
  }

  async updatePhone(userId: string, phone: string) {
    await this.getById(userId);
    await this.db.update(users).set({ phone }).where(eq(users.id, userId));
  }

  async setPassword(userId: string, password: string) {
    await this.getById(userId);
    const { hashPassword } = await import("../lib/argon2.js");
    const hashed = await hashPassword(password);

    const existing = await this.db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
    });
    if (existing) {
      await this.db.update(accounts).set({ password: hashed }).where(eq(accounts.id, existing.id));
    } else {
      await this.db.insert(accounts).values({
        id: randomUUID(), accountId: randomUUID(), providerId: "credential",
        userId, password: hashed,
      });
    }
  }
}
