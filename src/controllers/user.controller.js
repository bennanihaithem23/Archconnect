const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/response.util');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, role, isArtisan } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isArtisan !== undefined) {
      where.isArtisan = isArtisan === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isArtisan: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, users, pagination, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isArtisan: true,
        avatar: true,
        specialCode: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, phone, role, isArtisan, specialCode } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return sendError(res, 'User not found', 404);
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    
    // Only allow admin to update role and isArtisan
    if (req.user.role === 'ADMIN') {
      if (role !== undefined) updateData.role = role;
      if (isArtisan !== undefined) updateData.isArtisan = isArtisan;
      if (specialCode !== undefined) updateData.specialCode = specialCode;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isArtisan: true,
        avatar: true,
        specialCode: true,
        updatedAt: true
      }
    });

    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user._count.products > 0) {
      return sendError(res, 'Cannot delete user with existing products', 400);
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getUserProducts = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { ownerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.product.count({ where: { ownerId: userId } })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    const data = {
      user,
      products,
      pagination
    };

    sendSuccess(res, data, 'User products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProducts
};