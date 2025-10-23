import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import model from './models/User/index.js';
import { authenticateToken } from './middleware/auth.js';

export default {
  routes: {
    auth: authRouter,
    users: usersRouter,
  },
  model,
  middleware: { authenticateToken },
};
