import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { getUserSubscription } from '../services/stripeService';
import { getProductByPriceId } from '../stripe-config';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // If no session ID, redirect to home
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Fetch subscription details
    async function fetchSubscriptionDetails() {
      try {
        // Wait a moment to allow webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const data = await getUserSubscription();
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptionDetails();
  }, [sessionId, navigate]);

  // Get product details if subscription has a price_id
  const product = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
  const planName = product ? product.name : 'Premium Plan';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Thank you for your purchase. Your subscription is now active.
        </p>
        
        {isLoading ? (
          <div className="animate-pulse space-y-3 mb-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        ) : subscription ? (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {planName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your account has been upgraded with premium features.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Your payment was successful, but we're still processing your subscription. 
              It should be available shortly.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/app')}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Start Using Premium Features</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/account')}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-3 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            View Subscription Details
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}