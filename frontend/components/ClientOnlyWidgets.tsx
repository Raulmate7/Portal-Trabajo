'use client';

import dynamic from 'next/dynamic';

const CookieBanner = dynamic(() => import('@/components/CookieBanner'), { ssr: false });
const ExitIntentPopup = dynamic(() => import('@/components/ExitIntentPopup'), { ssr: false });
const StickyMobileAd = dynamic(() => import('@/components/StickyMobileAd'), { ssr: false });
const CompareFloatingPill = dynamic(() => import('@/components/CompareFloatingPill'), { ssr: false });
const InAppNotification = dynamic(() => import('@/components/InAppNotification'), { ssr: false });

export default function ClientOnlyWidgets() {
  return (
    <>
      <CookieBanner />
      <ExitIntentPopup />
      <StickyMobileAd />
      <CompareFloatingPill />
      <InAppNotification />
    </>
  );
}
