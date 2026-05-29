import {
  DriverStatus,
  PaymentMethod,
  PaymentStatus,
  RideFlow,
  RideMode,
  RideStatus,
  Role,
  ServiceType,
} from '@/generated/prisma/enums'

import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'

/* ---------------------- helpers ---------------------- */

const createLocation = () => ({
  lat: faker.number.float({ min: 29.8, max: 30.4, multipleOf: 0.00001 }),
  lng: faker.number.float({ min: 31.0, max: 31.6, multipleOf: 0.00001 }),
  address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
})

const createTimestamp = (base: Date, minutes: number) =>
  new Date(base.getTime() + minutes * 60_000)

/* ---------------------- users ---------------------- */

async function createUsers() {
  const clients = await Promise.all(
    Array.from({ length: 20 }).map(() =>
      prisma.user.create({
        data: {
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          role: Role.CLIENT,
          isVerified: true,
        },
      })
    )
  )

  const driverUsers = await Promise.all(
    Array.from({ length: 8 }).map(() =>
      prisma.user.create({
        data: {
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          role: Role.DRIVER,
          isVerified: true,
        },
      })
    )
  )

  const miscUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        role: Role.ADMIN,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        name: faker.person.fullName(),
        phone: '+20' + faker.string.numeric(10),
        email: faker.internet.email(),
        role: Role.CUSTOMER_SUPPORT,
        isVerified: true,
      },
    }),
  ])

  return { clients, driverUsers, miscUsers }
}

/* ---------------------- ride factory ---------------------- */

async function createRide({
  clients,
  drivers,
  status,
  rideMode,
  serviceType,
  rideFlow,
  maxPassengers,
  clientOffer,
  paymentMethod,
  paymentStatus,
  coupon,
  cancelReason,
}: {
  clients: Awaited<ReturnType<typeof prisma.user.findMany>>
  drivers: Awaited<ReturnType<typeof prisma.driver.findMany>>
  status: RideStatus
  rideMode: RideMode
  serviceType: ServiceType
  rideFlow: RideFlow
  maxPassengers: number
  clientOffer?: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  coupon?: { discountAmount: number }
  cancelReason?: string
}) {
  const client = faker.helpers.arrayElement(clients)
  const driver = faker.helpers.arrayElement(drivers)

  const pickup = createLocation()
  const dropoff = createLocation()

  const requestedAt = faker.date.recent({ days: 14 })

  const acceptedAt =
    status !== RideStatus.REQUESTED &&
      status !== RideStatus.EXPIRED &&
      status !== RideStatus.NO_DRIVER_FOUND
      ? createTimestamp(requestedAt, faker.number.int({ min: 2, max: 10 }))
      : undefined

  const startedAt =
    status === RideStatus.IN_PROGRESS || status === RideStatus.COMPLETED
      ? createTimestamp(acceptedAt ?? requestedAt, faker.number.int({ min: 3, max: 10 }))
      : undefined

  const completedAt =
    status === RideStatus.COMPLETED
      ? createTimestamp(startedAt ?? requestedAt, faker.number.int({ min: 5, max: 20 }))
      : undefined

  const cancelledAt =
    status === RideStatus.CLIENT_CANCELLED ||
      status === RideStatus.DRIVER_CANCELLED
      ? createTimestamp(acceptedAt ?? requestedAt, faker.number.int({ min: 2, max: 8 }))
      : undefined

  const systemFare = faker.number.float({ min: 15, max: 120, multipleOf: 0.01 })
  const discountAmount = coupon?.discountAmount ?? 0

  const negotiatedFare =
    rideFlow === RideFlow.NEGOTIATION ? clientOffer : undefined

  const finalFare =
    rideFlow === RideFlow.NEGOTIATION
      ? negotiatedFare ?? systemFare
      : Math.max(systemFare - discountAmount, 5)

  // 🔥 CARPOOLING FIX: منطقي ومحدود
  const passengers =
    rideMode === RideMode.CARPOOLING
      ? faker.number.int({ min: 1, max: Math.min(maxPassengers, 4) })
      : 1

  return prisma.ride.create({
    data: {
      clientId: client.id,
      driverId: driver?.id,

      status,
      rideMode,
      serviceType,
      rideFlow,

      maxPassengers,
      availableSeats:
        rideMode === RideMode.CARPOOLING
          ? Math.max(maxPassengers - passengers, 0)
          : 1,

      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupAddress: pickup.address,

      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      dropoffAddress: dropoff.address,

      distance: faker.number.float({ min: 2, max: 25, multipleOf: 0.1 }),
      duration: faker.number.int({ min: 5, max: 60 }),

      systemFare,
      clientOffer,
      negotiatedFare,
      discountAmount,
      finalFare,

      requestedAt,
      acceptedAt,
      startedAt,
      completedAt,
      cancelledAt,

      cancelReason,

      passengers:
        rideMode === RideMode.CARPOOLING
          ? {
            create: Array.from({ length: passengers }).map(() => {
              const loc1 = createLocation()
              const loc2 = createLocation()

              return {
                clientId: faker.helpers.arrayElement(clients).id,
                pickupLat: loc1.lat,
                pickupLng: loc1.lng,
                pickupAddress: loc1.address,
                dropoffLat: loc2.lat,
                dropoffLng: loc2.lng,
                dropoffAddress: loc2.address,
                fare: faker.number.float({
                  min: 5,
                  max: 20,
                  multipleOf: 0.01,
                }),
                joinedAt: faker.date.recent({ days: 10 }),
              }
            }),
          }
          : undefined,
    },
  })
}

/* ---------------------- main ---------------------- */

async function main() {
  const { clients, driverUsers } = await createUsers()

  const drivers = await Promise.all(
    driverUsers.map((user) =>
      prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: faker.string.alphanumeric(10),
          carModel: faker.vehicle.model(),
          carPlate: faker.string.alphanumeric(8),
          carColor: faker.color.human(),
          carYear: faker.number.int({ min: 2015, max: 2024 }),
          isApproved: true,
          status: faker.helpers.arrayElement([
            DriverStatus.ONLINE,
            DriverStatus.OFFLINE,
            DriverStatus.ON_TRIP,
          ]),
          latitude: faker.number.float({ min: 29.8, max: 30.4 }),
          longitude: faker.number.float({ min: 31.0, max: 31.6 }),
          lastLocationUpdate: faker.date.recent(),
        },
      })
    )
  )

  /* ---------------------- FIXED DISTRIBUTION ---------------------- */

  const plan = [
    {
      count: 10, data: () =>
        createRide({
          clients,
          drivers,
          status: RideStatus.COMPLETED,
          rideMode: RideMode.PRIVATE,
          serviceType: ServiceType.STANDARD,
          rideFlow: RideFlow.NORMAL,
          maxPassengers: 1,
          paymentMethod: PaymentMethod.CARD,
          paymentStatus: PaymentStatus.PAID,
        })
    },

    {
      count: 8, data: () =>
        createRide({
          clients,
          drivers,
          status: RideStatus.IN_PROGRESS,
          rideMode: RideMode.CARPOOLING,
          serviceType: ServiceType.VAN,
          rideFlow: RideFlow.NORMAL,
          maxPassengers: 4,
          paymentMethod: PaymentMethod.WALLET,
          paymentStatus: PaymentStatus.PENDING,
        })
    },

    {
      count: 6, data: () =>
        createRide({
          clients,
          drivers,
          status: RideStatus.CLIENT_CANCELLED,
          rideMode: RideMode.PRIVATE,
          serviceType: ServiceType.STANDARD,
          rideFlow: RideFlow.NORMAL,
          maxPassengers: 1,
          cancelReason: 'Client cancelled',
          paymentMethod: PaymentMethod.CARD,
          paymentStatus: PaymentStatus.REFUNDED,
        })
    },

    {
      count: 6, data: () =>
        createRide({
          clients,
          drivers,
          status: RideStatus.ACCEPTED,
          rideMode: RideMode.PRIVATE,
          serviceType: ServiceType.VIP,
          rideFlow: RideFlow.NEGOTIATION,
          maxPassengers: 1,
          clientOffer: 25,
          paymentMethod: PaymentMethod.CARD,
          paymentStatus: PaymentStatus.PENDING,
        })
    },
  ]

  const rides: any[] = []

  for (const item of plan) {
    for (let i = 0; i < item.count; i++) {
      rides.push(await item.data())
    }
  }

  console.log('✅ Seed completed with structured deterministic distribution')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })