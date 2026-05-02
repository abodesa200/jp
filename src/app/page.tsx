
import Image from "next/image";
import { io } from "socket.io-client";

export default function Home() {
  const socket = io("http://localhost:3001", {
  auth: {
    userId: "1",
    role: "DRIVER",
  },
});

socket.on("connect", () => {
  console.log("🔥 connected:", socket.id);
});
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     Home
    </div>
  );
}
