'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';

export default function TermsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      <main className="flex-grow pt-20 pb-8 px-4">
        <div className="space-y-12 font-mono max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl">TERMS</h1>

          <section className="space-y-4">
            <h2 className="text-lg">TERMS OF SERVICE</h2>
            <p className="leading-relaxed">
              By accessing and placing an order with Dataran Online, you confirm that you
              are in agreement with and bound by the terms and conditions contained
              herein.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">PRICING</h2>
            <p className="leading-relaxed">
              All prices are final and non-negotiable. Prices are listed in MYR and
              do not include taxes or shipping costs, which will be calculated at
              checkout.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">RETURNS & EXCHANGES</h2>
            <p className="leading-relaxed">
              Returns are only accepted in cases of factory defects. Customers must
              bear all costs associated with returns, including shipping and handling
              fees. No exchange policy is offered. All sales are final once the order
              is confirmed and processed.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}