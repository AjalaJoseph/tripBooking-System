import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/index";
// create log data
interface CreateAuditLogParams {
  event: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}
export const createAuditLog = async({
  event,
  userId,
  ipAddress,
  userAgent,
  metadata
}: CreateAuditLogParams)=>{
    const createLog = await prisma.auditLog.create({
        data: {
            event: event,
            userId: userId ?? null,       
            ipAddress: ipAddress ?? null, 
            userAgent: userAgent ?? null, 
            metadata: metadata ?? Prisma.DbNull,   
        }
    });
    return createLog
}