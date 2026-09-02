import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function DonationWidget({
  organizationId,
  campaignId,
  theme = 'light',
  suggestedAmounts = [10, 25, 50, 100],
  customClassName = '',
}) {
  const [amount, setAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [donorInfo, setDonorInfo] = useState({ name: '', email: '' });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleDonate = async (e) => {
    e.preventDefault();

    const finalAmount = isCustom ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }
    if (!donorInfo.email) {
      setError('Please enter your email address');
      return;
    }
    if (!donorInfo.name) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/payments/create-intent', {
        amount: finalAmount,
        currency: 'usd',
        campaignId,
        donorEmail: donorInfo.email,
        donorName: donorInfo.name,
        isRecurring,
        interval: recurringInterval,
      });

      const stripe = await stripePromise;
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        clientSecret: response.data.clientSecret,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: donorInfo.name,
              email: donorInfo.email,
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
      } else {
        setSuccess(true);
        setTransactionId(paymentIntent?.id || response.data.paymentIntentId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getThemeClasses = () => {
    if (theme === 'dark') {
      return {
        container: 'bg-gray-800 text-white',
        input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        suggested: 'bg-gray-700 hover:bg-gray-600 text-white',
        suggestedActive: 'bg-blue-600 text-white',
        error: 'bg-red-900 text-red-200',
        success: 'bg-green-900 text-green-200',
      };
    }
    return {
      container: 'bg-white text-gray-900',
      input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      suggested: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      suggestedActive: 'bg-blue-600 text-white',
      error: 'bg-red-50 text-red-600',
      success: 'bg-green-50 text-green-600',
    };
  };

  const styles = getThemeClasses();

  if (success) {
    return (
      <div className={`${styles.container} p-6 rounded-lg border shadow-sm ${customClassName}`}>
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Thank You!</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your donation of ${isCustom ? customAmount : amount} has been received.
          </p>
          {transactionId && (
            <p className="text-sm text-gray-400 mt-2">
              Transaction ID: {transactionId}
            </p>
          )}
          <button
            onClick={() => {
              setSuccess(false);
              setAmount(null);
              setCustomAmount('');
              setIsCustom(false);
              setDonorInfo({ name: '', email: '' });
            }}
            className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} p-6 rounded-lg border shadow-sm ${customClassName}`}>
      <h3 className="text-xl font-bold mb-4">Support Our Cause</h3>

      <form onSubmit={handleDonate}>
        {error && (
          <div className={`${styles.error} p-3 rounded-lg mb-4 flex items-center`}>
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Amount Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Amount</label>
          <div className="flex flex-wrap gap-2">
            {suggestedAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setIsCustom(false);
                  setAmount(amt);
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  !isCustom && amount === amt ? styles.suggestedActive : styles.suggested
                }`}
              >
                ${amt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsCustom(true);
                setAmount(null);
              }}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isCustom ? styles.suggestedActive : styles.suggested
              }`}
            >
              Custom
            </button>
          </div>

          {isCustom && (
            <div className="mt-3">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className={`w-full px-4 py-2 rounded-lg border ${styles.input} outline-none focus:ring-2 focus:ring-blue-500`}
                min="1"
                step="0.01"
                required
              />
            </div>
          )}
        </div>

        {/* Donor Info */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={donorInfo.name}
              onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
              placeholder="John Doe"
              className={`w-full px-4 py-2 rounded-lg border ${styles.input} outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={donorInfo.email}
              onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
              placeholder="john@example.org"
              className={`w-full px-4 py-2 rounded-lg border ${styles.input} outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
          </div>
        </div>

        {/* Recurring Option */}
        <div className="mb-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Make this a recurring donation
          </label>
          {isRecurring && (
            <select
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value)}
              className={`mt-2 w-full px-4 py-2 rounded-lg border ${styles.input} outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Donate ${isCustom ? customAmount || '0' : amount || '0'}
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
          Secure payment powered by Stripe
        </p>
      </form>
    </div>
  );
}
