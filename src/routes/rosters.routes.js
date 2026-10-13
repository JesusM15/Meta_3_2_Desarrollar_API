import { Router } from 'express';
import rostersController from '../controllers/rosters.controller.js';
import { requireAdmin } from '../middlewares/roleAuth.js';

const router = Router();

// Rosters CRUD
router.get('/', rostersController.getAll);
router.get('/:id', rostersController.getById);
router.post('/', requireAdmin, rostersController.create);
router.put('/:id', requireAdmin, rostersController.update);
router.delete('/:id', requireAdmin, rostersController.delete);

// Asignación de jugadores a rosters
router.get('/:id/jugadores', rostersController.getJugadores);
router.post('/:id/jugadores', requireAdmin, rostersController.assignJugador);
router.put('/:id/jugadores/:id_jugador', requireAdmin, rostersController.updateJugadorRol);
router.delete('/:id/jugadores/:id_jugador', requireAdmin, rostersController.removeJugador);

export default router;
