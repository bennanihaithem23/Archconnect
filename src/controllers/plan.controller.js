const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/response.util');

const createPlan = async (req, res, next) => {
  try {
    const { name, description, companyId } = req.body;

    // Verify company exists and user owns it
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });

    if (!company) {
      return sendError(res, 'Company not found', 404);
    }

    if (company.ownerId !== req.user.id) {
      return sendError(res, 'You can only create plans for your own companies', 403);
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        companyId: parseInt(companyId),
        ownerId: req.user.id
      },
      include: {
        company: {
          select: {
            id: true,
            raisonSociale: true,
            type: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            subPlans: true
          }
        }
      }
    });

    sendSuccess(res, plan, 'Plan created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, companyId } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (companyId) {
      where.companyId = parseInt(companyId);
    }

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              raisonSociale: true,
              type: true
            }
          },
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              subPlans: true
            }
          }
        }
      }),
      prisma.plan.count({ where })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, plans, pagination, 'Plans retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        company: {
          select: {
            id: true,
            raisonSociale: true,
            type: true,
            adresse: true,
            commune: true,
            wilaya: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        subPlans: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!plan) {
      return sendError(res, 'Plan not found', 404);
    }

    sendSuccess(res, plan, 'Plan retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const planId = parseInt(req.params.id);
    const { name, description } = req.body;

    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!existingPlan) {
      return sendError(res, 'Plan not found', 404);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            raisonSociale: true,
            type: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            subPlans: true
          }
        }
      }
    });

    sendSuccess(res, plan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const planId = parseInt(req.params.id);

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            subPlans: true
          }
        }
      }
    });

    if (!plan) {
      return sendError(res, 'Plan not found', 404);
    }

    if (plan._count.subPlans > 0) {
      return sendError(res, 'Cannot delete plan with existing sub-plans', 400);
    }

    await prisma.plan.delete({
      where: { id: planId }
    });

    sendSuccess(res, null, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getMyPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where: { ownerId: req.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              raisonSociale: true,
              type: true
            }
          },
          _count: {
            select: {
              subPlans: true
            }
          }
        }
      }),
      prisma.plan.count({ where: { ownerId: req.user.id } })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, plans, pagination, 'Your plans retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getMyPlans
};