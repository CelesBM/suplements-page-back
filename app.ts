import { Server } from "./models/server";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

export const prisma = new PrismaClient();
const server = new Server();
server.listen();

export default server.app;
