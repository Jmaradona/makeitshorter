import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { createCheckoutSession } from '../services/stripeService';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function PricingPlans() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useUserStore();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/login');
      return;
    }

    try {
      setIsLoading(priceId);
      const { url } = await createCheckoutSession(priceId);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription process');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Select the perfect plan for your email enhancement needs
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {STRIPE_PRODUCTS.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.02 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 bg-white dark:bg-gray-800 flex flex-col"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{product.name}</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">{product.description}</p>
              <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{product.price}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">per month</p>
              
              <ul className="mt-6 space-y-3 flex-grow">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSubscribe(product.priceId)}
                disabled={isLoading !== null}
                className="mt-8 w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {isLoading === product.priceId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Subscribe Now</span>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All plans include a 14-day money-back guarantee. Prices are in EUR and include VAT.
          </p>
        </div>
      </div>
    </div>
  );
}