import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// OTP Repository
// ─────────────────────────────────────────────

export const otpRepository = {
  /**
   * البحث عن OTP نشط (غير مستخدم وغير منتهي الصلاحية)
   */
  findActiveOtp(email: string,purpose: string) {
    return prisma.otpCode.findFirst({
      where: {
        email,
        used: false,
        purpose,
        expiresAt: { gt: new Date() },
      },
    });
  },

  /**
   * إنشاء OTP جديد
   */
  createOtp(email: string, hashedCode: string, expiresAt: Date,  purpose: string
) {
    return prisma.otpCode.create({
      data: {
        email,
          purpose,
        code: hashedCode,
        expiresAt,
      },
    });
  },

  /**
   * البحث عن آخر OTP نشط
   */
  findLatestOtp(email: string,purpose: string) {
    return prisma.otpCode.findFirst({
      where: {
        email,
        purpose,
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