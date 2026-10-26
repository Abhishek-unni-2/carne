// Everything the client still has to supply lives here.
// Leave a value as '' and the UI shows an honest "coming soon" state instead of a made-up one.
export const CONFIG = {
  zeptoUrl: '',            // TODO: Zepto store / listing link. Every purchase path uses this.
  email: '',               // TODO: contact email
  phone: '',               // TODO: contact phone
  social: {
    instagram: '',         // TODO
    facebook: '',          // TODO
    linkedin: '',          // TODO
  },
  formEndpoint: '',        // TODO: POST target (Formspree, Netlify, own API). Empty = form validates but sends nothing.
};
