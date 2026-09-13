import { StudioSetting } from '../types';

export const DEFAULT_STUDIOS: StudioSetting[] = [
  {
    id: 'moms_splash',
    name: 'MOMS Golden Oil Splash',
    thumbnailUrl: '/moms_studio_bg.jpg',
    bgImageUrl: '/moms_studio_bg.jpg',
    category: 'moms_official',
    blur: 0,
    brightness: 1.0,
  },
  {
    id: 'moms_soft_studio',
    name: 'MOMS Clean Studio Vignette',
    thumbnailUrl: '/moms_studio_bg.jpg',
    bgImageUrl: '/moms_studio_bg.jpg',
    category: 'moms_official',
    blur: 2,
    brightness: 1.05,
  },
];

export const PREMADE_SCRIPTS = [
  {
    id: 'script_driveway',
    title: 'Driveway Service Promo (30s)',
    text: `Why spend two hours waiting in a dirty oil change waiting room on your Saturday?

With MOMS Mobile Oil Change, our certified technicians come directly to your driveway or workplace!

Full synthetic oil, OEM-grade filter, and a comprehensive 21-point safety inspection—all done while you relax at home.

Scan the QR code right here or visit momsoilchange.com to book your appointment in under 60 seconds!`,
  },
  {
    id: 'script_fleet',
    title: 'Commercial Fleet Maintenance (45s)',
    text: `Attention business owners and fleet managers! Every hour your vans sit in a service shop is money lost.

MOMS Fleet Maintenance services your entire fleet on-site during your scheduled downtime—evenings, early mornings, or weekends.

We handle routine oil changes, filter replacements, fluid top-offs, and multi-point inspections with zero business interruption.

Visit momsoilchange.com today to request a fleet quote!`,
  },
  {
    id: 'script_quick',
    title: 'Quick 15s Hook (TikTok / Reel)',
    text: `Stop going to the lube shop! MOMS Mobile Oil Change changes your oil right in your driveway. Book in 60 seconds at momsoilchange.com!`,
  },
];
