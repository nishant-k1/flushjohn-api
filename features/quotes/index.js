// Quotes Feature Module
import routes from './routes/quotes.js';
import model from './models/Quotes/index.js';
import emailTemplate from './templates/email/index.js';
import pdfTemplate from './templates/pdf/index.js';

export default {
  routes,
  model,
  templates: {
    email: emailTemplate,
    pdf: pdfTemplate,
  },
};

