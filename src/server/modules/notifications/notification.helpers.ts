import { sendNotificationToUser, sendNotificationToUsers } from "./notification.service";

// ─────────────────────────────────────────────
// Notification Templates
// ─────────────────────────────────────────────

/**
 * إشعارات الرحلات
 */
export const rideNotifications = {
    /**
     * إشعار للزبون: تم قبول الرحلة
     */
    async rideAccepted(clientId: number, driverName: string) {
        return sendNotificationToUser(
            clientId,
            "تم قبول الرحلة",
            `السائق ${driverName} قبل طلبك وفي الطريق إليك`
        );
    },

    /**
     * إشعار للزبون: السائق وصل
     */
    async driverArrived(clientId: number, driverName: string) {
        return sendNotificationToUser(
            clientId,
            "السائق وصل",
            `السائق ${driverName} وصل إلى موقعك`
        );
    },

    /**
     * إشعار للزبون: بدأت الرحلة
     */
    async rideStarted(clientId: number) {
        return sendNotificationToUser(
            clientId,
            "بدأت الرحلة",
            "رحلتك بدأت، نتمنى لك رحلة سعيدة"
        );
    },

    /**
     * إشعار للزبون: انتهت الرحلة
     */
    async rideCompleted(clientId: number, fare: number) {
        return sendNotificationToUser(
            clientId,
            "انتهت الرحلة",
            `رحلتك انتهت. المبلغ المطلوب: ${fare} ريال`
        );
    },

    /**
     * إشعار للزبون: تم إلغاء الرحلة
     */
    async rideCancelled(clientId: number, reason?: string) {
        const message = reason
            ? `تم إلغاء رحلتك. السبب: ${reason}`
            : "تم إلغاء رحلتك";

        return sendNotificationToUser(clientId, "تم إلغاء الرحلة", message);
    },

    /**
     * إشعار للسائق: طلب رحلة جديد
     */
    async newRideRequest(driverId: number, pickupAddress: string) {
        return sendNotificationToUser(
            driverId,
            "طلب رحلة جديد",
            `لديك طلب رحلة جديد من ${pickupAddress}`
        );
    },

    /**
     * إشعار لعدة سائقين: طلب رحلة جديد في المنطقة
     */
    async broadcastRideRequest(driverIds: number[], pickupAddress: string) {
        return sendNotificationToUsers(
            driverIds,
            "طلب رحلة جديد",
            `يوجد طلب رحلة جديد في ${pickupAddress}`
        );
    },
};

/**
 * إشعارات الدفع
 */
export const paymentNotifications = {
    /**
     * إشعار: تم الدفع بنجاح
     */
    async paymentSuccess(userId: number, amount: number) {
        return sendNotificationToUser(
            userId,
            "تم الدفع بنجاح",
            `تم دفع ${amount} ريال بنجاح`
        );
    },

    /**
     * إشعار: فشل الدفع
     */
    async paymentFailed(userId: number, reason?: string) {
        const message = reason
            ? `فشل الدفع. السبب: ${reason}`
            : "فشل الدفع، يرجى المحاولة مرة أخرى";

        return sendNotificationToUser(userId, "فشل الدفع", message);
    },

    /**
     * إشعار: تم استرجاع المبلغ
     */
    async paymentRefunded(userId: number, amount: number) {
        return sendNotificationToUser(
            userId,
            "تم استرجاع المبلغ",
            `تم استرجاع ${amount} ريال إلى حسابك`
        );
    },
};

/**
 * إشعارات السائقين
 */
export const driverNotifications = {
    /**
     * إشعار: تم قبول طلب السائق
     */
    async driverApproved(driverId: number) {
        return sendNotificationToUser(
            driverId,
            "تم قبول طلبك",
            "مبروك! تم قبول طلبك كسائق. يمكنك الآن البدء في استقبال الرحلات"
        );
    },

    /**
     * إشعار: تم رفض طلب السائق
     */
    async driverRejected(driverId: number, reason?: string) {
        const message = reason
            ? `تم رفض طلبك كسائق. السبب: ${reason}`
            : "تم رفض طلبك كسائق";

        return sendNotificationToUser(driverId, "تم رفض طلبك", message);
    },

    /**
     * إشعار: تقييم جديد
     */
    async newReview(driverId: number, rating: number, comment?: string) {
        const message = comment
            ? `حصلت على تقييم ${rating}/5: ${comment}`
            : `حصلت على تقييم ${rating}/5`;

        return sendNotificationToUser(driverId, "تقييم جديد", message);
    },
};

/**
 * إشعارات الترويج
 */
export const promoNotifications = {
    /**
     * إشعار: كود خصم جديد
     */
    async newPromoCode(userId: number, code: string, discount: string) {
        return sendNotificationToUser(
            userId,
            "كود خصم جديد",
            `استخدم الكود ${code} واحصل على خصم ${discount}`
        );
    },

    /**
     * إشعار جماعي: عرض خاص
     */
    async specialOffer(userIds: number[], title: string, message: string) {
        return sendNotificationToUsers(userIds, title, message);
    },
};

/**
 * إشعارات النظام
 */
export const systemNotifications = {
    /**
     * إشعار: تحديث التطبيق
     */
    async appUpdate(userIds: number[], version: string) {
        return sendNotificationToUsers(
            userIds,
            "تحديث التطبيق",
            `يتوفر تحديث جديد للتطبيق (${version}). يرجى التحديث للحصول على أحدث الميزات`
        );
    },

    /**
     * إشعار: صيانة النظام
     */
    async maintenance(userIds: number[], startTime: string, duration: string) {
        return sendNotificationToUsers(
            userIds,
            "صيانة النظام",
            `سيتم إجراء صيانة للنظام في ${startTime} لمدة ${duration}`
        );
    },

    /**
     * إشعار: رسالة من الدعم الفني
     */
    async supportMessage(userId: number, message: string) {
        return sendNotificationToUser(userId, "رسالة من الدعم الفني", message);
    },
};
