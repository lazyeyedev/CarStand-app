// Build a wa.me link from a phone number as people in Ghana type it.
// wa.me only accepts the full international number with no leading zero or
// plus sign, so "055 456 5852" must become "233554565852". A local number
// passed through unchanged opens WhatsApp on a number that doesn't exist.
const GHANA_CODE = '233';

export const whatsappLink = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);            // 00233…
  else if (digits.startsWith('0')) digits = GHANA_CODE + digits.slice(1); // 055… -> 23355…
  else if (digits.length === 9) digits = GHANA_CODE + digits;        // 55 456 5852
  return `https://wa.me/${digits}`;
};
