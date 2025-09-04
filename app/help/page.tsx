'use client';

import Link from 'next/link';
import { Header } from '@/components/header';

export default function HelpPage() {
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      <main className="flex-grow pt-20 pb-8 px-4">
        <div className="space-y-12 font-mono max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl">HELP</h1>

          

          <section className="space-y-4">
            <h2 className="text-lg">ALL SALES FINAL</h2>
            <p className="leading-relaxed">
              All sales are final. Event tickets and limited-run merchandise are
              non-refundable except where required by law. Review your order before
              checkout.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">SUPPORT</h2>
            <p className="leading-relaxed">
              For order or ticket issues, reach us via the official contact links on
              dataran.online and include your order number and details of the issue.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">TOUR</h2>
            <p className="leading-relaxed">
              Take a quick interactive tour to learn how to browse products, 
              track orders, and manage your cart.
            </p>
            <Link 
              href="/onboarding"
              className="inline-block bg-black text-white px-6 py-3 rounded font-mono text-sm hover:bg-gray-800 transition-colors"
            >
              START TOUR
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}