import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'Shivansh Sharma — Backend & AI systems',
  description:
    'Backend and AI systems engineer. Agent harnesses, hybrid retrieval and real-time backends — Alfred, DocIntel and Hex.',
};

export const viewport = {
  themeColor: '#07080A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
