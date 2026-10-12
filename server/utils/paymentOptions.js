/** Single source of truth for demo payment methods. Only labels are ever stored - never credentials. */
export const PAYMENT_OPTIONS = {
  UPI: ['Google Pay', 'PhonePe', 'Paytm', 'UPI ID'],
  CARD: ['Credit Card', 'Debit Card'],
  NETBANKING: ['Demo Bank of India', 'Sample National Bank', 'Example Co-operative Bank', 'Test Savings Bank'],
  WALLET: ['Demo Wallet', 'Sample Pay Wallet', 'Example Cash Wallet'],
};
export const PAYMENT_METHODS = Object.keys(PAYMENT_OPTIONS);
