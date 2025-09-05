const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/response.util');

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, brand, color, imageUrl, arModelUrl, arModelPreview } = req.body;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        brand,
        color,
        imageUrl,
        arModelUrl,
        arModelPreview,
        ownerId: req.user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, categoryId, brand, color, minPrice, maxPrice, sortBy, sortOrder } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    if (color) {
      where.color = { contains: color, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Build orderBy clause
    let orderBy = { createdAt: 'desc' };
    if (sortBy) {
      const validSortFields = ['name', 'price', 'rating', 'createdAt', 'updatedAt'];
      if (validSortFields.includes(sortBy)) {
        orderBy = { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
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
      prisma.product.count({ where })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, products, pagination, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            isArtisan: true
          }
        }
      }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    sendSuccess(res, product, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, categoryId, brand, color, imageUrl, arModelUrl, arModelPreview } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return sendError(res, 'Product not found', 404);
    }

    // Verify category exists if categoryId is provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });

      if (!category) {
        return sendError(res, 'Category not found', 404);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (brand !== undefined) updateData.brand = brand;
    if (color !== undefined) updateData.color = color;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (arModelUrl !== undefined) updateData.arModelUrl = arModelUrl;
    if (arModelPreview !== undefined) updateData.arModelPreview = arModelPreview;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    sendSuccess(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { ownerId: req.user.id },
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
      prisma.product.count({ where: { ownerId: req.user.id } })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, products, pagination, 'Your products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts
};