'use client';

import { Header } from '@/components/header';
import { FooterMenu } from '@/components/footer-menu';

export default function ContactPage() {
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
          <h1 className="text-xl">CONTACT</h1>

          <section className="space-y-4">
            <h2 className="text-lg">EMAIL</h2>
            <p className="leading-relaxed">
              <a 
                href="mailto:hello@dataran.online" 
                className="text-blue-600 hover:underline"
              >
                support@dataran.online
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg">SUPPORT</h2>
            <p className="leading-relaxed">
              For order inquiries, use our tracking system or email us directly.
              We typically respond within 24 hours.
            </p>
          </section>

         {/* <section className="space-y-4">
            <h2 className="text-lg">BUSINESS HOURS</h2>
            <p className="leading-relaxed">
              MON - FRI: 9:00 AM - 6:00 PM<br/>
              SAT: 10:00 AM - 4:00 PM<br/>
              SUN: CLOSED<br/>
              <span className="text-sm opacity-70">Malaysian Standard Time (GMT+8)</span>
            </p>
          </section> */}

          <section className="space-y-4">
            <h2 className="text-lg">RETURNS & EXCHANGES</h2>
            <p className="leading-relaxed">
              Please refer to our <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> for return policy details.
            </p>
          </section>
        </div>
      </main>
      
      {/* Footer Menu */}
      <div className="fixed bottom-5 left-5 z-10">
        <FooterMenu />
      </div>
    </div>
  );
}
