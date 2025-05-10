import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, Check, AlertTriangle } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      toast.error('To integrate Stripe payments, please visit https://bolt.new/setup/stripe');
      // This URL will be shown to users, who can then follow the link to set up Stripe
      
      // Wait briefly to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal after showing message
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upgrade Your Plan</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Daily Limit Reached</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      You've used all your free messages for today. Upgrade to get unlimited access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Premium Plan</h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      Recommended
                    </span>
                  </div>
                  <div className="flex items-baseline mb-4">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">$9.99</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/month</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {[
                      'Unlimited daily messages',
                      'Priority response times',
                      'Access to all features',
                      'Email support',
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium ml-2">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Upgrade Now</span>
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Secure payment processing powered by Stripe
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}