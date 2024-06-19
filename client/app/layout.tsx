import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/styles/globals.scss";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--poppins-font",
});

export const metadata: Metadata = {
  title: "YT Media Downloader",
  description: "Download videos on YouTube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <QueryProvider>
          <Header />
          <ToastContainer limit={1} />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
