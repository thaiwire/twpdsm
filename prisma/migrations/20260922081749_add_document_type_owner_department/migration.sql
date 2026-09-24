BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[DocumentType] ADD [ownerDepartmentId] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentType_ownerDepartmentId_idx] ON [dbo].[DocumentType]([ownerDepartmentId]);

-- AddForeignKey
ALTER TABLE [dbo].[DocumentType] ADD CONSTRAINT [DocumentType_ownerDepartmentId_fkey] FOREIGN KEY ([ownerDepartmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
