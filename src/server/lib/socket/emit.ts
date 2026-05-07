// Simple helper to emit socket events from API routes
export async function emitSocketEvent(
  room: string,
  event: string,
  data: any,
): Promise<boolean> {
  try {
    const socketUrl = process.env.SOCKET_URL || "http://localhost:3001";
    const response = await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, event, data }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to emit socket event:", error);
    return false;
  }
}
