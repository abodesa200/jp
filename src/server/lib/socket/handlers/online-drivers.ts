const onlineDrivers = new Map<number, {
  socketId: string;
  lastHeartbeat: number;
  location?: { lat: number; lng: number };
}>();

export function setDriverOnline(userId: number, socketId: string) {
  onlineDrivers.set(userId, {
    socketId,
    lastHeartbeat: Date.now(),
  });
}

export function setDriverOffline(userId: number) {
  onlineDrivers.delete(userId);
}

export function updateDriverHeartbeat(userId: number, location?: { lat: number; lng: number }) {
  const driver = onlineDrivers.get(userId);
  if (!driver) return;

  driver.lastHeartbeat = Date.now();
  if (location) driver.location = location;
}

export function isDriverOnline(userId: number) {
  return onlineDrivers.has(userId);
}

export function getOnlineDrivers() {
  return Array.from(onlineDrivers.entries());
}