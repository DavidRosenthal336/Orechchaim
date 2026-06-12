import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Heebo } from "next/font/google";
import "./globals.css";

const appSans = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
  display: "swap",
});

const appHebrew = Heebo({
  variable: "--font-app-hebrew",
  subsets: ["hebrew"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orechchaim",
  description:
    "A daily growth checklist, based on the Jewish calendar — to stay with what you've gained.",
  applicationName: "Orechchaim",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1722" },
  ],
};

// Apply the saved theme before first paint to avoid a flash.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('orech-theme');
    if (t === 'dark') document.documentElement.classList.add('theme-dark');
    else if (t === 'light') document.documentElement.classList.add('theme-light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${appSans.variable} ${appHebrew.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
