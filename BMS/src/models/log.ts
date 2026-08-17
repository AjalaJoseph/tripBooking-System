import { prisma } from "../config/db.js";
import { Prisma } from "../generated/prisma/index.js";
// create log data
interface CreateAuditLogParams {
  event: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue
}
export const createAuditLog = async({
  event,
  userId,
  ipAddress,
  userAgent,
  metadata
}: CreateAuditLogParams)=>{
    const createLog = await prisma.auditLog.create({
        data:{
            event:event,
            userId:userId|| null,
            ipAddress:ipAddress,
            userAgent:userAgent,
            metadata:metadata
        }
    })
    return createLog
}