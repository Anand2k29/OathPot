"use client";
import { useSession } from "@/lib/sessionContext";

export default function ToastContainer() {
  const { toasts } = useSession();
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`pop nb-sm px-4 py-3 font-bold text-sm ${t.type === "success" ? "c-lime" : t.type === "error" ? "c-pink" : "c-cyan"}`}>
          {t.type === "success" ? "✅ " : t.type === "error" ? "⛔ " : "⏳ "}{t.message}
        </div>
      ))}
    </div>
  );
}
