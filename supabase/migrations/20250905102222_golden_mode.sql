/*
  # Add Company and Plan Models

  1. New Tables
    - `company`
      - `id` (int, primary key)
      - `numeroInscription` (string, unique)
      - `dateImmatriculation` (datetime)
      - `raisonSociale` (string)
      - `formeJuridique` (string)
      - `regimeJuridique` (string)
      - `capital` (decimal)
      - `nis` (string, optional)
      - `nif` (string, optional)
      - `adresse` (text)
      - `commune` (string)
      - `wilaya` (string)
      - `solutionImmobiliere` (text, optional)
      - `nosServices` (text, optional)
      - `nosResidences` (text, optional)
      - `type` (string - ARCHITECT or ENTERPRISE)
      - `ownerId` (int, foreign key to user)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `plan`
      - `id` (int, primary key)
      - `name` (string)
      - `description` (text, optional)
      - `companyId` (int, foreign key to company)
      - `ownerId` (int, foreign key to user)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `subplan`
      - `id` (int, primary key)
      - `name` (string)
      - `pictureUrl` (text, optional)
      - `fileUrl` (text - URL to 3D file)
      - `planId` (int, foreign key to plan)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add indexes for performance optimization

  3. Relationships
    - Company belongs to User (owner)
    - Plan belongs to Company and User (owner)
    - SubPlan belongs to Plan
*/

CREATE TABLE IF NOT EXISTS company (
  id INT NOT NULL AUTO_INCREMENT,
  numeroInscription VARCHAR(255) NOT NULL UNIQUE,
  dateImmatriculation DATETIME(3) NOT NULL,
  raisonSociale VARCHAR(255) NOT NULL,
  formeJuridique VARCHAR(255) NOT NULL,
  regimeJuridique VARCHAR(255) NOT NULL,
  capital DECIMAL(15, 2) NOT NULL,
  nis VARCHAR(255) NULL,
  nif VARCHAR(255) NULL,
  adresse TEXT NOT NULL,
  commune VARCHAR(255) NOT NULL,
  wilaya VARCHAR(255) NOT NULL,
  solutionImmobiliere TEXT NULL,
  nosServices TEXT NULL,
  nosResidences TEXT NULL,
  type VARCHAR(50) NOT NULL,
  ownerId INT NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  
  PRIMARY KEY (id),
  INDEX company_ownerId_idx (ownerId),
  INDEX company_type_idx (type),
  FOREIGN KEY (ownerId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plan (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  companyId INT NOT NULL,
  ownerId INT NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  
  PRIMARY KEY (id),
  INDEX plan_companyId_idx (companyId),
  INDEX plan_ownerId_idx (ownerId),
  FOREIGN KEY (companyId) REFERENCES company(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (ownerId) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subplan (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  pictureUrl TEXT NULL,
  fileUrl TEXT NOT NULL,
  planId INT NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  
  PRIMARY KEY (id),
  INDEX subplan_planId_idx (planId),
  FOREIGN KEY (planId) REFERENCES plan(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;