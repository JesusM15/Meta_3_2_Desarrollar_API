import { Router } from 'express';
import jugadoresRoutes from './jugadores.routes.js';
import rostersRoutes from './rosters.routes.js';
import auxiliaresRoutes from './auxiliares.routes.js';

const apiRouter = Router();

apiRouter.use('/jugadores', jugadoresRoutes);
apiRouter.use('/rosters', rostersRoutes);
apiRouter.use('/', auxiliaresRoutes);

export default apiRouter;
