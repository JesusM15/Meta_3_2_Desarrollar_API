import { Router } from 'express';
import auxiliaresController from '../controllers/auxiliares.controller.js';

const router = Router();

router.get('/roles', (req, res) => auxiliaresController.getRoles(req, res));
router.get('/estados', (req, res) => auxiliaresController.getEstados(req, res));
router.get('/tipos-roster', (req, res) => auxiliaresController.getTiposRoster(req, res));
router.get('/health', (req, res) => auxiliaresController.getHealth(req, res));

export default router;
