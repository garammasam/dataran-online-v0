'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { animationClasses } from '@/lib/animations';
import { useCart } from '@/components/cart-context';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart since the order was successful
    clearCart();
    
    // Auto redirect to home after 10 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router, clearCart]);

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header isBackVisible={false} onBack={handleBack} />
      
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className={`text-center max-w-md px-4 sm:px-6 lg:px-8 ${animationClasses.fadeInUp}`}>
          <div className={`mb-8 ${animationClasses.scaleIn}`} style={{ animationDelay: '200ms' }}>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>

          <h1 className={`font-mono uppercase text-2xl mb-4 ${animationClasses.fadeIn}`} style={{ animationDelay: '400ms' }}>
            Order Confirmed
          </h1>

          <div className={`space-y-4 mb-8 ${animationClasses.fadeIn}`} style={{ animationDelay: '600ms' }}>
            <p className="font-mono text-sm text-gray-600">
              Thank you for your purchase!
            </p>
            <p className="font-mono text-sm text-gray-600">
              You will receive an email confirmation shortly with your order details and tracking information.
            </p>
          </div>

          <button
            onClick={handleContinueShopping}
            className={`bg-black text-white px-8 py-3 font-mono uppercase text-sm hover:bg-gray-800 transition-colors ${animationClasses.fadeIn}`}
            style={{ animationDelay: '800ms' }}
          >
            BROWSE
          </button>

          <p className={`font-mono text-xs text-gray-500 mt-6 ${animationClasses.fadeIn}`} style={{ animationDelay: '1000ms' }}>
            Redirecting to home page in 10 seconds...
          </p>
        </div>
      </main>
    </div>
  );
}