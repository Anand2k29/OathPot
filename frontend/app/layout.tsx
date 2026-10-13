import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";
import { SessionProvider } from "@/lib/sessionContext";
import ToastContainer from "@/components/ToastContainer";


export const metadata: Metadata = {
  title: "Oathpot | Put your money where your goals are",
  description: "Stake small amounts on shared goals with friends. Friends verify check-ins. Winners split the stakes of those who quit.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffd93d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <ToastContainer />
        </SessionProvider>
      </body>
    </html>
  );
}
