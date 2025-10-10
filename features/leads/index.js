// Leads Feature Module
import routes from './routes/leads.js';
import model from './models/Leads/index.js';
import { leadSocketHandler as socket } from './sockets/leads.js';

export default {
  routes,
  model,
  socket,
};

