export const SERVICE_RULES = {
    STANDARD: {
      maxPassengers: 4,
      multiplier: 1,
      allowCarpooling: true,
    },
  
    VIP: {
      maxPassengers: 4,
      multiplier: 2.2,
      allowCarpooling: false,
    },
  
    VAN: {
      maxPassengers: 8,
      multiplier: 1.6,
      allowCarpooling: true,
    },
  } as const;