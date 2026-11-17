export const ENQUIRY_TYPE_LABEL = { general: 'General', price: 'Price', test_drive: 'Test drive', finance: 'Finance' };

// Sender details: signed-in buyers come from their account, guests from the form.
export const enquirySender = (e) => ({
  name: e.user?.name || e.guestName || 'Guest',
  email: e.user?.email || e.guestEmail,
  phone: e.user?.phone || e.guestPhone,
  isGuest: !e.user,
});
