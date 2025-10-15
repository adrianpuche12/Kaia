// Rutas de usuario
import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Completar onboarding
router.post('/onboarding', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      phone,
      address,
      city,
      country,
      birthDate,
      interests,
      favoriteCategories,
      notificationsEnabled,
      locationEnabled,
    } = req.body;

    // Actualizar datos del usuario
    const updateData: any = {
      onboardingCompleted: true,
    };

    // Solo agregar campos si tienen valor
    if (phone !== undefined && phone !== null && phone !== '') {
      updateData.phone = phone;
    }
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (birthDate) updateData.birthDate = new Date(birthDate);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Crear o actualizar preferencias
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        interests: JSON.stringify(interests || []),
        favoriteCategories: JSON.stringify(favoriteCategories || []),
        pushEnabled: notificationsEnabled !== false,
        locationTrackingEnabled: locationEnabled !== false,
      },
      create: {
        userId,
        interests: JSON.stringify(interests || []),
        favoriteCategories: JSON.stringify(favoriteCategories || []),
        pushEnabled: notificationsEnabled !== false,
        locationTrackingEnabled: locationEnabled !== false,
      },
    });

    res.json({
      success: true,
      data: {
        success: true,
        user: {
          ...updatedUser,
          password: undefined, // No enviar password
        },
        preferences,
      },
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Error al completar el onboarding',
      details: error.message,
    });
  }
});

// Obtener perfil del usuario
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        password: undefined, // No enviar password
      },
    });
  } catch (error: any) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil',
      details: error.message,
    });
  }
});

// Actualizar perfil del usuario
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      lastName,
      phone,
      address,
      city,
      country,
      birthDate,
      avatar,
    } = req.body;

    const updateData: any = {};

    // Solo agregar campos si tienen valor
    if (name !== undefined) updateData.name = name;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined && phone !== null && phone !== '') {
      updateData.phone = phone;
    }
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      success: true,
      user: {
        ...updatedUser,
        password: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil',
      details: error.message,
    });
  }
});

// Obtener preferencias
router.get('/preferences', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Crear preferencias por defecto si no existen
      const newPreferences = await prisma.userPreferences.create({
        data: {
          userId,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          locationTrackingEnabled: true,
          voiceEnabled: true,
          language: 'es',
          timezone: 'Europe/Madrid',
        },
      });

      return res.json({
        success: true,
        data: newPreferences,
      });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener preferencias',
      details: error.message,
    });
  }
});

// Actualizar preferencias
router.put('/preferences', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferencesData = req.body;

    // Convertir arrays a JSON strings si es necesario
    const processedData: any = {};
    for (const [key, value] of Object.entries(preferencesData)) {
      if (Array.isArray(value)) {
        processedData[key] = JSON.stringify(value);
      } else {
        processedData[key] = value;
      }
    }

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: processedData,
      create: {
        userId,
        ...processedData,
      },
    });

    res.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar preferencias',
      details: error.message,
    });
  }
});

// Cambiar contraseña
router.put('/password', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Se requiere currentPassword y newPassword',
        },
      });
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La nueva contraseña debe tener al menos 8 caracteres',
        },
      });
    }

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    // Verificar contraseña actual
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'La contraseña actual es incorrecta',
        },
      });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al cambiar contraseña',
      },
      details: error.message,
    });
  }
});

export default router;
