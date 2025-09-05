const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/response.util');

const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, imageUrl, isActive, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        icon,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }
    });

    sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { search, isActive } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      prisma.category.count({ where })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, categories, pagination, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    sendSuccess(res, category, 'Category retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, description, icon, imageUrl, isActive, sortOrder } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return sendError(res, 'Category not found', 404);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    sendSuccess(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    if (category._count.products > 0) {
      return sendError(res, 'Cannot delete category with existing products', 400);
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    sendSuccess(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getCategoryProducts = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.product.count({ where: { categoryId } })
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
      category,
      products,
      pagination
    };

    sendSuccess(res, data, 'Category products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryProducts
};