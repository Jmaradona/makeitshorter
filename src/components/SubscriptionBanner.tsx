import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserSubscription, formatDate } from '../services/stripeService';
import { getProductByPriceId } from '../stripe-config';
import { useUserStore } from '../store/userStore';

export default function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setIsLoading(false);
        return;
      }

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
  }, [user]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Sign in to access premium features
            </span>
          </div>
          <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    );
  }

  // If no subscription found
  if (!subscription || !subscription.subscription_id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Upgrade to a premium plan for unlimited access
            </span>
          </div>
          <Link
            to="/pricing"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Upgrade
          </Link>
        </div>
      </motion.div>
    );
  }

  // If subscription is active
  const isActive = ['active', 'trialing'].includes(subscription.subscription_status);
  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const planName = product ? product.name : 'Premium Plan';
  const renewalDate = formatDate(subscription.current_period_end);

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
            <div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {planName} Active
              </span>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Renews on {renewalDate}
              </p>
            </div>
          </div>
          <Link
            to="/account"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
          >
            Manage
          </Link>
        </div>
      </motion.div>
    );
  }

  // If subscription is not active (canceled, past_due, etc.)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
          <div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Subscription {subscription.subscription_status}
            </span>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Please renew your subscription to continue using premium features
            </p>
          </div>
        </div>
        <Link
          to="/pricing"
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          Renew
        </Link>
      </div>
    </motion.div>
  );
}