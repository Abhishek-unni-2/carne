// Everything the client still has to supply lives here.
// Leave a value as '' and the UI shows an honest "coming soon" state instead of a made-up one.
export const CONFIG = {
  email: 'carneandgusto@gmail.com',
  phone: '+91 78889 03481',
  social: {
    instagram: 'https://www.instagram.com/carneandgusto/',
    facebook: '',          // TODO
    linkedin: '',          // TODO
  },
  formEndpoint: '',        // TODO: POST target (Formspree, Netlify, own API). Empty = form validates but sends nothing.
};
