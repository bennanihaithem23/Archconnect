const { verifyToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/response.util');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isArtisan: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(req.params.id);
      let resource;

      switch (resourceType) {
        case 'product':
          resource = await prisma.product.findUnique({
            where: { id: resourceId },
            select: { ownerId: true }
          });
          break;
        case 'user':
          resource = { ownerId: resourceId };
          break;
        default:
          return sendError(res, 'Invalid resource type', 400);
      }

      if (!resource) {
        return sendError(res, `${resourceType} not found`, 404);
      }

      if (resource.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
        return sendError(res, 'Access denied: You can only access your own resources', 403);
      }

      next();
    } catch (error) {
      return sendError(res, 'Authorization check failed', 500);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  checkOwnership
};