import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserSubscription, formatDate } from '../services/stripeService';
import { getProductByPriceId, STRIPE_PRODUCTS } from '../stripe-config';

export default function AccountSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const data = await getUserSubscription();
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // If no subscription found
  if (!subscription || !subscription.subscription_id) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subscription</h2>
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Active Subscription</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You don't have an active subscription. Upgrade to access premium features.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  // If subscription exists
  const isActive = ['active', 'trialing'].includes(subscription.subscription_status);
  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const planName = product ? product.name : 'Premium Plan';
  const planDescription = product ? product.description : '';
  const renewalDate = formatDate(subscription.current_period_end);
  const startDate = formatDate(subscription.current_period_start);

  // Find the next tier for upgrade suggestion
  const currentTierIndex = STRIPE_PRODUCTS.findIndex(p => p.priceId === subscription.price_id);
  const nextTier = currentTierIndex < STRIPE_PRODUCTS.length - 1 ? STRIPE_PRODUCTS[currentTierIndex + 1] : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subscription</h2>
      
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isActive ? 'Active' : subscription.subscription_status}
          </span>
        </div>
        
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">{planName}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{planDescription}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Started on</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{startDate}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Renews on</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{renewalDate}</p>
            </div>
          </div>
        </div>
        
        {subscription.payment_method_brand && (
          <div className="mt-4 flex items-center">
            <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment method</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {subscription.payment_method_brand.charAt(0).toUpperCase() + subscription.payment_method_brand.slice(1)} •••• {subscription.payment_method_last4}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {isActive && nextTier && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upgrade your plan</h4>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex justify-between items-center">
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200">{nextTier.name}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">{nextTier.description}</p>
              </div>
              <Link
                to="/pricing"
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Upgrade
              </Link>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="flex justify-between">
        <Link
          to="/pricing"
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          View all plans
        </Link>
        
        {isActive && (
          <a
            href="https://billing.stripe.com/p/login/test_28o5nA9Rl9Oi9OM288"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Manage billing
          </a>
        )}
      </div>
    </div>
  );
}