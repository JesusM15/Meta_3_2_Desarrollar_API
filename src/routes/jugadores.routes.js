import { Router } from 'express';
import jugadoresController from '../controllers/jugadores.controller.js';
import { requireAdmin } from '../middlewares/roleAuth.js';

const router = Router();

router.get('/', jugadoresController.getAll);
router.get('/:id', jugadoresController.getById);
router.post('/', requireAdmin, jugadoresController.create);
router.put('/:id', requireAdmin, jugadoresController.update);
router.delete('/:id', requireAdmin, jugadoresController.delete);

export default router;
