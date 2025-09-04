'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';

export default function AboutPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      <main className="flex-grow pt-20 pb-8 px-4">
        <div className="space-y-12 font-mono max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl">ABOUT</h1>

      <section className="space-y-4">
        <h2 className="text-lg">DATARAN ONLINE</h2>
        <p className="leading-relaxed">
          dataran.online is a Malaysia-based platform for culture and commerce —
          producing events, powering ticketing, and shipping limited-run merch
          with in-house fulfillment.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg">SERVICES</h2>
        <p className="leading-relaxed">
          We promote shows, manage ticketing, and handle
          small-batch merchandise production and fulfillment for partners.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg">COLLABORATION</h2>
        <p className="leading-relaxed">
          We collaborate with local artists, venues, and labels. For inquiries,
          reach us via the official channels listed on dataran.online.
        </p>
      </section>
        </div>
      </main>
    </div>
  );
}
