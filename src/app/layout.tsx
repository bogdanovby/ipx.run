import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f38020",
};

export const metadata: Metadata = {
  title: "ipx.run — Instant IP Address Lookup & Analysis",
  description: "Mellifluous, clean and responsive IP analysis. Instantly resolve geolocation, ISP, DNS, user-agent, map location, and check for WebRTC private IP leaks with cloudflare aesthetics.",
  keywords: ["IP lookup", "IP address analysis", "geolocation", "WebRTC leak test", "reverse DNS", "ISP details", "Cloudflare style"],
  authors: [{ name: "ipx.run team" }],
  robots: "index, follow",
  openGraph: {
    title: "ipx.run — Instant IP Address Lookup & Analysis",
    description: "Mellifluous, clean and responsive IP analysis. Instantly resolve geolocation, ISP, DNS, user-agent, map location, and check for WebRTC private IP leaks with cloudflare aesthetics.",
    url: "https://ipx.run",
    type: "website",
    siteName: "ipx.run",
  },
  twitter: {
    card: "summary_large_image",
    title: "ipx.run — Instant IP Address Lookup & Analysis",
    description: "Mellifluous, clean and responsive IP analysis. Instantly resolve geolocation, ISP, DNS, user-agent, map location, and check for WebRTC private IP leaks with cloudflare aesthetics.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const pinnedTheme = localStorage.getItem('theme');
                if (pinnedTheme === 'dark' || (!pinnedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground selection:bg-orange-500/20 selection:text-orange-500">
        {children}
      </body>
    </html>
  );
}
