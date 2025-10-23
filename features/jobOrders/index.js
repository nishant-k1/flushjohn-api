import routes from './routes/jobOrders.js';
import model from './models/JobOrders/index.js';
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
