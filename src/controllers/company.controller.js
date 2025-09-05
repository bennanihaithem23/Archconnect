const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/response.util');

const createCompany = async (req, res, next) => {
  try {
    const {
      numeroInscription,
      dateImmatriculation,
      raisonSociale,
      formeJuridique,
      regimeJuridique,
      capital,
      nis,
      nif,
      adresse,
      commune,
      wilaya,
      solutionImmobiliere,
      nosServices,
      nosResidences,
      type
    } = req.body;

    const company = await prisma.company.create({
      data: {
        numeroInscription,
        dateImmatriculation: new Date(dateImmatriculation),
        raisonSociale,
        formeJuridique,
        regimeJuridique,
        capital: parseFloat(capital),
        nis,
        nif,
        adresse,
        commune,
        wilaya,
        solutionImmobiliere,
        nosServices,
        nosResidences,
        type,
        ownerId: req.user.id
      },
      include: {
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
            plans: true
          }
        }
      }
    });

    sendSuccess(res, company, 'Company created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, type, wilaya, commune } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { raisonSociale: { contains: search, mode: 'insensitive' } },
        { numeroInscription: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (wilaya) {
      where.wilaya = { contains: wilaya, mode: 'insensitive' };
    }

    if (commune) {
      where.commune = { contains: commune, mode: 'insensitive' };
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
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
          },
          _count: {
            select: {
              plans: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, companies, pagination, 'Companies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        plans: {
          include: {
            _count: {
              select: {
                subPlans: true
              }
            }
          }
        }
      }
    });

    if (!company) {
      return sendError(res, 'Company not found', 404);
    }

    sendSuccess(res, company, 'Company retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.id);
    const {
      numeroInscription,
      dateImmatriculation,
      raisonSociale,
      formeJuridique,
      regimeJuridique,
      capital,
      nis,
      nif,
      adresse,
      commune,
      wilaya,
      solutionImmobiliere,
      nosServices,
      nosResidences,
      type
    } = req.body;

    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return sendError(res, 'Company not found', 404);
    }

    const updateData = {};
    if (numeroInscription !== undefined) updateData.numeroInscription = numeroInscription;
    if (dateImmatriculation !== undefined) updateData.dateImmatriculation = new Date(dateImmatriculation);
    if (raisonSociale !== undefined) updateData.raisonSociale = raisonSociale;
    if (formeJuridique !== undefined) updateData.formeJuridique = formeJuridique;
    if (regimeJuridique !== undefined) updateData.regimeJuridique = regimeJuridique;
    if (capital !== undefined) updateData.capital = parseFloat(capital);
    if (nis !== undefined) updateData.nis = nis;
    if (nif !== undefined) updateData.nif = nif;
    if (adresse !== undefined) updateData.adresse = adresse;
    if (commune !== undefined) updateData.commune = commune;
    if (wilaya !== undefined) updateData.wilaya = wilaya;
    if (solutionImmobiliere !== undefined) updateData.solutionImmobiliere = solutionImmobiliere;
    if (nosServices !== undefined) updateData.nosServices = nosServices;
    if (nosResidences !== undefined) updateData.nosResidences = nosResidences;
    if (type !== undefined) updateData.type = type;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
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
            plans: true
          }
        }
      }
    });

    sendSuccess(res, company, 'Company updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.id);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            plans: true
          }
        }
      }
    });

    if (!company) {
      return sendError(res, 'Company not found', 404);
    }

    if (company._count.plans > 0) {
      return sendError(res, 'Cannot delete company with existing plans', 400);
    }

    await prisma.company.delete({
      where: { id: companyId }
    });

    sendSuccess(res, null, 'Company deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getMyCompanies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: { ownerId: req.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              plans: true
            }
          }
        }
      }),
      prisma.company.count({ where: { ownerId: req.user.id } })
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    sendPaginatedSuccess(res, companies, pagination, 'Your companies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getMyCompanies
};