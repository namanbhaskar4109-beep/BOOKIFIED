import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Serif, Mona_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bookified",
  description: "Transform your books into Interactive AI-powered experiences and chat with your books using chats",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
    
    >
      <body 
      className={`${ibmPlexSerif.variable} ${monaSans.variable} relative font-sans antialiased`}
    >
        <ClerkProvider appearance={{ theme: shadcn }}>
          <Navbar></Navbar>
          {children}
          <Toaster/>
        </ClerkProvider>
      </body>
    </html>
  );
}