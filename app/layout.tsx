import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'MOMS White Screen Studio',
  description: 'Create polished MOMS Mobile Oil Change and Fleet Maintenance videos from your browser.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
