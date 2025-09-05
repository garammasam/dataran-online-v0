'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';

export default function PrivacyPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      <main className="flex-grow pt-20 pb-8 px-4">
        <div className="space-y-12 font-mono max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl">PRIVACY</h1>

          <section className="space-y-4">
            <h2 className="text-lg">DATA COLLECTION</h2>
            <p className="leading-relaxed">
              We collect the minimum information needed to process orders and
              tickets: name, email, shipping address (for merch), and basic ticket
              details.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">DATA USAGE</h2>
            <p className="leading-relaxed">
              We use your information for order fulfillment, ticket issuance, and
              customer support. Payments are processed by third-party providers (e.g.
              Atome and payment gateways); they receive the data necessary to
              complete the transaction. We do not sell your data.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
