// Sales Orders Feature Module
import routes from './routes/salesOrders.js';
import model from './models/SalesOrders/index.js';
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

