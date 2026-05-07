import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// OTP Repository
// ─────────────────────────────────────────────

export const otpRepository = {
  /**
   * البحث عن OTP نشط (غير مستخدم وغير منتهي الصلاحية)
   */
  findActiveOtp(email: string) {
    return prisma.otpCode.findFirst({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });
  },

  /**
   * إنشاء OTP جديد
   */
  createOtp(email: string, hashedCode: string, expiresAt: Date) {
    return prisma.otpCode.create({
      data: {
        email,
        code: hashedCode,
        expiresAt,
      },
    });
  },

  /**
   * البحث عن آخر OTP نشط
   */
  findLatestOtp(email: string) {
    return prisma.otpCode.findFirst({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * تحديد OTP كمستخدم (atomic operation)
   */
  markAsUsed(id: number) {
    return prisma.otpCode.updateMany({
      where: { id, used: false },
      data: { used: true },
    });
  },

  /**
   * حذف جميع OTPs المنتهية الصلاحية
   */
  deleteExpired() {
    return prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  },
};