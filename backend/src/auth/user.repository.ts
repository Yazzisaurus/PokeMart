import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UserRepository {

    constructor(private prisma: PrismaService) {}

    findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(email: string, password: string) {
        try {
            return await this.prisma.user.create({
                data: { email, password },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                return null;
            }
            throw error;
        }
    }
}
