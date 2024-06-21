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
  description:
    "A convenient way to download videos on YouTube and saving them to your device while offering various download formats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#323949" />
      </head>
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
