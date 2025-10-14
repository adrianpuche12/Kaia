// Rutas de MCPs
import { Router } from 'express';
import { MCPController } from '../controllers/mcp.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { mcpRateLimiter } from '../middleware/rateLimiter';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET routes
router.get('/', MCPController.listMCPs);
router.get('/recommended', MCPController.getRecommendedMCPs);
router.get('/capability/:capability', MCPController.findByCapability);
router.get('/executions/history', MCPController.getExecutionHistory);
router.get('/stats', MCPController.getMCPStats);
router.get('/:id', validateId(), MCPController.getMCPById);

// POST routes
router.post('/', validateBody(schemas.registerMCP), MCPController.registerMCP);
router.post('/execute', mcpRateLimiter, validateBody(schemas.executeMCP), MCPController.executeMCP);
router.post('/:id/toggle', validateId(), validateBody(schemas.toggleMCP), MCPController.toggleMCP);
router.post('/:id/rate', validateId(), validateBody(schemas.rateMCP), MCPController.rateMCP);

// PUT routes
router.put('/:id', validateId(), validateBody(schemas.updateMCP), MCPController.updateMCP);
router.put('/:id/toggle', validateId(), validateBody(schemas.toggleMCP), MCPController.toggleMCP);

// DELETE routes
router.delete('/:id', validateId(), MCPController.deleteMCP);

export default router;
