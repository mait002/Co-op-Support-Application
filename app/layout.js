import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "COSA - Co-op Support Application",
  description: "Platform for co-op program applications, reporting, and evaluations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
