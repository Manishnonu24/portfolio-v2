import { Cormorant_Garamond, Imprima, Josefin_Sans } from 'next/font/google';
import './globals.css';
import ChatbotLoader from '../components/ChatbotLoader';

const displayFont = Josefin_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-josefin',
  display: 'swap',
});

const bodyFont = Imprima({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-imprima',
  display: 'swap',
});

const serifFont = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: 'Manish Yadav — Software Developer & Data Science Engineer',
  description: 'Portfolio of Manish Yadav, Software Developer Intern specializing in Next.js, Python, Data Engineering, and REST APIs.',
  keywords: ['Manish Yadav', 'Software Developer', 'Data Science', 'Next.js', 'Python', 'FastAPI', 'ETL Pipelines', 'AKGEC'],
  openGraph: {
    title: 'Manish Yadav — Software Developer & Data Science Engineer',
    description: 'Software Developer Intern & CSE Data Science Engineer specializing in Next.js, Python, and scalable backend applications.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${serifFont.variable}`}
    >
      <body>
        {children}
        <ChatbotLoader />
      </body>
    </html>
  );
}
