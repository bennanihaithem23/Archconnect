const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/response.util');

const createSubPlan = async (req, res, next) => {
  try {
    const { name, pictureUrl, fileUrl, planId } = req.body;

    // Verify plan exists and user owns it
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId) },
      include: {
        company: true
      }
    });

    if (!plan) {
      return sendError(res, 'Plan not found', 404);
    }

    if (plan.ownerId !== req.user.id) {
      return sendError(res, 'You can only create sub-plans for your own plans', 403);
    }

    const subPlan = await prisma.subPlan.create({
      data: {
        name,
        pictureUrl,
        fileUrl,
        planId: parseInt(planId)
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                raisonSociale: true,
                type: true
              }
            }
          }
        }
      }
    });

    sendSuccess(res, subPlan, 'Sub-plan created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getSubPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, planId } = req.query;

    const where = {};
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (planId) {
      where.planId = parseInt(planId);
    }

    const [subPlans, total] = await Promise.all([
      prisma.subPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              company: {
                select: {
                  id: true,
                  raisonSociale: true,
                  type: true
                }
              }
            }
          }
        }
      }),
      prisma.subPlan.count({ where })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, subPlans, pagination, 'Sub-plans retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSubPlanById = async (req, res, next) => {
  try {
    const subPlan = await prisma.subPlan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        plan: {
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
            }
          }
        }
      }
    });

    if (!subPlan) {
      return sendError(res, 'Sub-plan not found', 404);
    }

    sendSuccess(res, subPlan, 'Sub-plan retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSubPlan = async (req, res, next) => {
  try {
    const subPlanId = parseInt(req.params.id);
    const { name, pictureUrl, fileUrl } = req.body;

    const existingSubPlan = await prisma.subPlan.findUnique({
      where: { id: subPlanId },
      include: {
        plan: true
      }
    });

    if (!existingSubPlan) {
      return sendError(res, 'Sub-plan not found', 404);
    }

    if (existingSubPlan.plan.ownerId !== req.user.id) {
      return sendError(res, 'You can only update your own sub-plans', 403);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

    const subPlan = await prisma.subPlan.update({
      where: { id: subPlanId },
      data: updateData,
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                raisonSociale: true,
                type: true
              }
            }
          }
        }
      }
    });

    sendSuccess(res, subPlan, 'Sub-plan updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSubPlan = async (req, res, next) => {
  try {
    const subPlanId = parseInt(req.params.id);

    const subPlan = await prisma.subPlan.findUnique({
      where: { id: subPlanId },
      include: {
        plan: true
      }
    });

    if (!subPlan) {
      return sendError(res, 'Sub-plan not found', 404);
    }

    if (subPlan.plan.ownerId !== req.user.id) {
      return sendError(res, 'You can only delete your own sub-plans', 403);
    }

    await prisma.subPlan.delete({
      where: { id: subPlanId }
    });

    sendSuccess(res, null, 'Sub-plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getMySubPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [subPlans, total] = await Promise.all([
      prisma.subPlan.findMany({
        where: {
          plan: {
            ownerId: req.user.id
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              company: {
                select: {
                  id: true,
                  raisonSociale: true,
                  type: true
                }
              }
            }
          }
        }
      }),
      prisma.subPlan.count({
        where: {
          plan: {
            ownerId: req.user.id
          }
        }
      })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, subPlans, pagination, 'Your sub-plans retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubPlan,
  getSubPlans,
  getSubPlanById,
  updateSubPlan,
  deleteSubPlan,
  getMySubPlans
};