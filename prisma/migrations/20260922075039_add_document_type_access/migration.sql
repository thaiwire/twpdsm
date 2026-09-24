BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[DocumentTypeAccess] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [documentTypeId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DocumentTypeAccess_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DocumentTypeAccess_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DocumentTypeAccess_userId_documentTypeId_key] UNIQUE NONCLUSTERED ([userId],[documentTypeId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentTypeAccess_documentTypeId_idx] ON [dbo].[DocumentTypeAccess]([documentTypeId]);

-- AddForeignKey
ALTER TABLE [dbo].[DocumentTypeAccess] ADD CONSTRAINT [DocumentTypeAccess_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentTypeAccess] ADD CONSTRAINT [DocumentTypeAccess_documentTypeId_fkey] FOREIGN KEY ([documentTypeId]) REFERENCES [dbo].[DocumentType]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
