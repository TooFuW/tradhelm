import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MapProvider } from "../lib/map/MapContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Tradhelm",
    description: "Jeu de stratégie et politique en temps réel",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <MapProvider>
                    {children}
                </MapProvider>
            </body>
        </html>
    );
}
