BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [employeeCode] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'STAFF',
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [departmentId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_employeeCode_key] UNIQUE NONCLUSTERED ([employeeCode]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Department] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [Department_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Department_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Department_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Department_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentType] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [numberFormat] NVARCHAR(1000) NOT NULL CONSTRAINT [DocumentType_numberFormat_df] DEFAULT '{code}-{year}-{seq:4}',
    [isActive] BIT NOT NULL CONSTRAINT [DocumentType_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DocumentType_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [DocumentType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DocumentType_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Document] (
    [id] NVARCHAR(1000) NOT NULL,
    [documentNumber] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Document_status_df] DEFAULT 'ACTIVE',
    [documentTypeId] NVARCHAR(1000) NOT NULL,
    [departmentId] NVARCHAR(1000) NOT NULL,
    [documentDate] DATETIME2 NOT NULL,
    [createdById] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Document_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Document_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Document_documentNumber_key] UNIQUE NONCLUSTERED ([documentNumber])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentFile] (
    [id] NVARCHAR(1000) NOT NULL,
    [documentId] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [storagePath] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [sizeBytes] INT NOT NULL,
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [DocumentFile_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DocumentFile_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentAudit] (
    [id] NVARCHAR(1000) NOT NULL,
    [documentId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [detail] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DocumentAudit_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DocumentAudit_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_departmentId_idx] ON [dbo].[User]([departmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Document_departmentId_idx] ON [dbo].[Document]([departmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Document_documentTypeId_idx] ON [dbo].[Document]([documentTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Document_status_idx] ON [dbo].[Document]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Document_documentDate_idx] ON [dbo].[Document]([documentDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentFile_documentId_idx] ON [dbo].[DocumentFile]([documentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentAudit_documentId_idx] ON [dbo].[DocumentAudit]([documentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentAudit_userId_idx] ON [dbo].[DocumentAudit]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_documentTypeId_fkey] FOREIGN KEY ([documentTypeId]) REFERENCES [dbo].[DocumentType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_createdById_fkey] FOREIGN KEY ([createdById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentFile] ADD CONSTRAINT [DocumentFile_documentId_fkey] FOREIGN KEY ([documentId]) REFERENCES [dbo].[Document]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentAudit] ADD CONSTRAINT [DocumentAudit_documentId_fkey] FOREIGN KEY ([documentId]) REFERENCES [dbo].[Document]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentAudit] ADD CONSTRAINT [DocumentAudit_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
