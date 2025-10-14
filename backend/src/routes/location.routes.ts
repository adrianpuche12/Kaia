// Rutas de ubicación
import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { locationRateLimiter } from '../middleware/rateLimiter';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET routes - Location
router.get('/', LocationController.getLastLocation);
router.get('/history', LocationController.getLocationHistory);
router.get('/stats', LocationController.getLocationStats);

// GET routes - Geofencing
router.get('/geofences', LocationController.listGeofences);
router.get('/nearby', LocationController.findNearbyPlaces);
router.get('/closest', LocationController.findClosestPlace);
router.get('/near/:placeId', LocationController.isNearPlace);

// POST routes - Location (con rate limiting para geocoding y cálculo de rutas)
router.post('/', validateBody(schemas.updateLocation), LocationController.updateLocation);
router.post('/route', locationRateLimiter, validateBody(schemas.calculateRoute), LocationController.calculateRoute);
router.post('/geocode', locationRateLimiter, validateBody(schemas.geocode), LocationController.geocode);
router.post('/reverse-geocode', locationRateLimiter, validateBody(schemas.reverseGeocode), LocationController.reverseGeocode);

// POST routes - Geofencing
router.post('/geofence', validateBody(schemas.createGeofence), LocationController.createGeofence);

// DELETE routes
router.delete('/geofence/:id', validateId(), LocationController.deleteGeofence);

export default router;
