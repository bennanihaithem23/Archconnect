generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Product {
  id             Int       @id @default(autoincrement())
  name           String    @db.VarChar(255)
  description    String?   @db.Text
  price          Decimal   @db.Decimal(10, 2)
  categoryId     Int
  brand          String?   @db.VarChar(255)
  color          String?   @db.VarChar(50)
  imageUrl       String?   @db.Text
  arModelUrl     String?   @db.Text
  arModelPreview String?   @db.Text
  rating         Float?    @default(0)
  reviewCount    Int?      @default(0)
  ownerId        Int
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  category       Category  @relation(fields: [categoryId], references: [id])
  owner          User      @relation(fields: [ownerId], references: [id])

  @@index([categoryId])
  @@index([ownerId])
  @@map("product")
}

model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique @db.VarChar(255)
  description String?   @db.Text
  icon        String?   @db.VarChar(255)
  imageUrl    String?   @db.Text
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)

  products    Product[]

  @@map("category")
}

model User {
  id           Int       @id @default(autoincrement())
  username     String    @unique @db.VarChar(255)
  email        String    @unique @db.VarChar(255)
  phone        String?   @db.VarChar(20)
  password     String    @db.VarChar(255)
  firstName    String?   @db.VarChar(255)
  lastName     String?   @db.VarChar(255)
  avatar       String?   @db.Text
  role         String    @default("USER") @db.VarChar(50)
  specialCode  String?   @db.VarChar(20)
  isArtisan    Boolean   @default(false)
  resetToken       String?   // Add this
  resetTokenExpiry DateTime? // Add this
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  products     Product[]
  companies    Company[]
  plans        Plan[]

  @@map("user")
}

model Company {
  id                    Int       @id @default(autoincrement())
  numeroInscription     String    @unique @db.VarChar(255)
  dateImmatriculation   DateTime
  raisonSociale         String    @db.VarChar(255)
  formeJuridique        String    @db.VarChar(255)
  regimeJuridique       String    @db.VarChar(255)
  capital               Decimal   @db.Decimal(15, 2)
  nis                   String?   @db.VarChar(255)
  nif                   String?   @db.VarChar(255)
  adresse               String    @db.Text
  commune               String    @db.VarChar(255)
  wilaya                String    @db.VarChar(255)
  solutionImmobiliere   String?   @db.Text
  nosServices           String?   @db.Text
  nosResidences         String?   @db.Text
  type                  String    @db.VarChar(50) // "ARCHITECT" or "ENTERPRISE"
  ownerId               Int
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  owner                 User      @relation(fields: [ownerId], references: [id])
  plans                 Plan[]

  @@index([ownerId])
  @@index([type])
  @@map("company")
}

model Plan {
  id          Int       @id @default(autoincrement())
  name        String    @db.VarChar(255)
  description String?   @db.Text
  companyId   Int
  ownerId     Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  company     Company   @relation(fields: [companyId], references: [id])
  owner       User      @relation(fields: [ownerId], references: [id])
  subPlans    SubPlan[]

  @@index([companyId])
  @@index([ownerId])
  @@map("plan")
}

model SubPlan {
  id          Int       @id @default(autoincrement())
  name        String    @db.VarChar(255)
  pictureUrl  String?   @db.Text
  fileUrl     String    @db.Text // URL to 3D file
  planId      Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  plan        Plan      @relation(fields: [planId], references: [id])

  @@index([planId])
  @@map("subplan")
}