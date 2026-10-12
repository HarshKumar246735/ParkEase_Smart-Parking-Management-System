// Demo-only client validation. These values are NEVER sent to the server or stored: only { sessionId, method, provider } is.
export const EMPTY_FORM = { cardName: '', cardNumber: '', expiry: '', cvv: '', upiId: '' };

export const DEMO_VALUES = { cardName: 'Demo Visitor', cardNumber: '4111 1111 1111 1111', expiry: '12/34', cvv: '123', upiId: 'demo@demobank' };

export const formatCardNumber = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
export const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function validatePaymentForm(method, provider, f) {
  const e = {};
  if (method === 'UPI') {
    if (!provider) e.provider = 'Choose a UPI app';
    if (provider === 'UPI ID' && !/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(f.upiId.trim())) e.upiId = 'Enter a UPI ID like name@bank';
  } else if (method === 'CARD') {
    if (!provider) e.provider = 'Choose a card type';
    if (f.cardName.trim().length < 2) e.cardName = 'Enter the name on the card';
    if (f.cardNumber.replace(/\D/g, '').length !== 16) e.cardNumber = 'Enter a 16-digit card number';
    const m = /^(\d{2})\/(\d{2})$/.exec(f.expiry);
    if (!m || +m[1] < 1 || +m[1] > 12) e.expiry = 'Enter expiry as MM/YY';
    else {
      const now = new Date();
      const exp = new Date(2000 + +m[2], +m[1], 1);
      if (exp <= now) e.expiry = 'This card has expired';
    }
    if (!/^\d{3}$/.test(f.cvv)) e.cvv = 'Enter the 3-digit CVV';
  } else if (method === 'NETBANKING') {
    if (!provider) e.provider = 'Select a bank';
  } else if (method === 'WALLET') {
    if (!provider) e.provider = 'Select a wallet';
  }
  return e;
}
