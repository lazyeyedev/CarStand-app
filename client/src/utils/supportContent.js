// Everything the help widget says lives in this file, so the wording can be
// changed without touching the component.

// "Talk to a person" only appears once at least one of these is set.
//   whatsapp: full international number, digits only, e.g. '233241234567'
//   email:    e.g. 'support@carmiumcars.com'
export const SUPPORT_CONTACT = {
  whatsapp: null,
  email: null,
};

export const GREETING = "Hi, I'm the Carmium help assistant. Pick a topic and I'll point you the right way.";

// audience: who sees the question. 'all' | 'guest' (signed out) | 'user' (buyer) | 'dealer'
// answer:   one string per paragraph
// links:    optional buttons under the answer, as in-app paths
export const CATEGORIES = [
  {
    id: 'buying',
    label: 'Buying a car',
    questions: [
      {
        id: 'how-buy',
        audience: 'all',
        q: 'How do I buy a car here?',
        answer: [
          'Browse the listings, open a car you like, and send the dealer an enquiry from the form on that page. You can do this with or without an account.',
          'The dealer then contacts you directly by phone, email or WhatsApp to arrange a viewing and agree the sale.',
        ],
        links: [{ to: '/listings', label: 'Browse cars' }],
      },
      {
        id: 'pay',
        audience: 'all',
        q: 'Do I pay through Carmium?',
        answer: [
          'No. Carmium connects you with the dealer; the sale and the payment happen between you and the dealer.',
          'See the car in person, check its documents, and avoid paying a deposit for a car you have not seen.',
        ],
      },
      {
        id: 'verified',
        audience: 'all',
        q: 'What does "Verified" mean on a dealer?',
        answer: [
          'Every dealership is reviewed by the Carmium team before its listings go live. The Verified badge marks dealers whose business details the team has confirmed.',
        ],
      },
      {
        id: 'my-enquiries',
        audience: 'all',
        q: 'Where do I see enquiries I sent?',
        answer: [
          'If you were signed in when you sent them, they are listed under My enquiries in your account menu.',
          'Enquiries sent without an account are not saved to a profile; the dealer replies to the contact details you gave.',
        ],
        links: [{ to: '/profile/enquiries', label: 'My enquiries', audience: 'signedIn' }],
      },
    ],
  },
  {
    id: 'selling',
    label: 'Selling cars',
    questions: [
      {
        id: 'become-dealer',
        audience: 'guest',
        q: 'How do I start selling?',
        answer: [
          'Register your dealership with your contact and business details. Each dealership is reviewed before its listings go live, which usually takes one working day.',
          'Already have a buyer account? Sign in first and choose Become a dealer, so you keep the same login.',
        ],
        links: [{ to: '/register/dealer', label: 'Register as a dealer' }, { to: '/login', label: 'Sign in' }],
      },
      {
        id: 'upgrade',
        audience: 'user',
        q: 'Can I sell with this account?',
        answer: [
          'Yes. Choose Become a dealer and add your dealership details. Your account keeps the same login and your enquiry history.',
          'Your dealership is reviewed before listings go live, which usually takes one working day.',
        ],
        links: [{ to: '/register/dealer', label: 'Become a dealer' }],
      },
      {
        id: 'add-listing',
        audience: 'dealer',
        q: 'How do I list a car?',
        answer: [
          'Go to My listings and choose to add a listing. Title, make, model, year, price and at least one photo are required.',
          'You can add up to 10 photos per car, as JPEG, PNG or WebP, each 5MB or smaller.',
          'New listings are reviewed by the Carmium team before they appear in search.',
        ],
        links: [{ to: '/dealer/listings/create', label: 'Add a listing' }],
      },
      {
        id: 'not-showing',
        audience: 'dealer',
        q: "Why isn't my listing showing?",
        answer: [
          'A listing appears publicly only when both the listing and your dealership are approved. Check its status under My listings: "Pending review" means it is waiting for the team.',
          'If you change the title, make, model, year, condition, description or photos of an approved listing, it goes back to review. Price, mileage, colour and location changes stay live.',
        ],
        links: [{ to: '/dealer/listings', label: 'My listings' }],
      },
      {
        id: 'edit-remove',
        audience: 'dealer',
        q: 'How do I edit or remove a listing?',
        answer: [
          'Open My listings and use the edit or delete action next to the car. Remove a listing as soon as the car is sold so buyers are not sent to a car that is gone.',
        ],
        links: [{ to: '/dealer/listings', label: 'My listings' }],
      },
      {
        id: 'cost',
        audience: 'all',
        q: 'What does it cost to list?',
        answer: [
          'Registering a dealership and listing cars is free on the Basic plan.',
        ],
      },
      {
        id: 'dealer-enquiries',
        audience: 'dealer',
        q: 'Where do buyer enquiries go?',
        answer: [
          'Each enquiry is emailed to the address on your account with the buyer\'s contact details, so you can reply directly. Your most recent enquiries also show on your dealer dashboard.',
        ],
        links: [{ to: '/dealer/dashboard', label: 'Dealer dashboard' }],
      },
    ],
  },
  {
    id: 'account',
    label: 'My account',
    questions: [
      {
        id: 'forgot',
        audience: 'all',
        q: 'I forgot my password',
        answer: [
          'Use the Forgot password link on the sign-in page and enter your email. If an account exists, you get a reset link.',
          'The link works once and expires after one hour. If it has expired, request a new one.',
        ],
        links: [{ to: '/forgot-password', label: 'Reset my password' }],
      },
      {
        id: 'change-pw',
        audience: 'signedIn',
        q: 'How do I change my password?',
        answer: [
          'Open your profile and use the Change password section. You stay signed in on this device, and any other device signed in to your account is signed out.',
        ],
        links: [
          { to: '/profile', label: 'My profile', audience: 'user' },
          { to: '/dealer/profile', label: 'Dealer profile', audience: 'dealer' },
        ],
      },
      {
        id: 'signed-out',
        audience: 'all',
        q: 'Why was I signed out?',
        answer: [
          'You are signed out when your password is changed or reset, or after a long period without signing in. Sign in again with your current password.',
          'If your account has been deactivated, sign-in shows a message saying so.',
        ],
        links: [{ to: '/login', label: 'Sign in', audience: 'guest' }],
      },
      {
        id: 'change-email',
        audience: 'signedIn',
        q: 'Can I change my email?',
        answer: [
          'Not from your profile at the moment. Your name, phone number and photo can be changed there.',
        ],
      },
    ],
  },
];
