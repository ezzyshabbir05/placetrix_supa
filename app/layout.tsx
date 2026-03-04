import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";


export const metadata: Metadata = {
  title: "Placetrix",
  description:
    "Practice mock tests, join study groups, and track your progress with Placetrix.",
  icons: {
    icon: "/placetrix-light.svg",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        ><TooltipProvider>{children}
            <Toaster position="top-center"/>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
