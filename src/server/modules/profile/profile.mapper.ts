export function mapClientUpdate(data: any) {
    return {
        userData: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
        },
    }
}

export function mapDriverUpdate(data: any) {
    return {
        userData: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
        },
        driverData: {
            licenseNumber: data.licenseNumber,
            carModel: data.carModel,
            carPlate: data.carPlate,
            carColor: data.carColor,
            carYear: data.carYear,
            isOnline: data.isOnline,
            latitude: data.latitude,
            longitude: data.longitude,
            lastLocationUpdate:
                data.latitude || data.longitude ? new Date() : undefined,
        },
    }
}