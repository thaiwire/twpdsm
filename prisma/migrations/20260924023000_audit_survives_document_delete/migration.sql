/*
  DocumentAudit.documentId becomes nullable (ON DELETE SET NULL instead of
  CASCADE) so that deleting a document doesn't also wipe out the audit rows
  that recorded its own deletion. documentNumber/documentTitle are added as a
  snapshot so the log stays readable even after the source document is gone.

  Added as nullable here; a follow-up migration backfills existing rows and
  then enforces NOT NULL (kept as a separate migration file because SQL
  Server's batch compilation resolves column references at parse time, so an
  UPDATE referencing a column added earlier in the same script/transaction
  batch can fail with "Invalid column name").
*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[DocumentAudit] DROP CONSTRAINT [DocumentAudit_documentId_fkey];

-- AlterTable
ALTER TABLE [dbo].[DocumentAudit] ALTER COLUMN [documentId] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[DocumentAudit] ADD [documentNumber] NVARCHAR(1000) NULL,
[documentTitle] NVARCHAR(1000) NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentAudit_createdAt_idx] ON [dbo].[DocumentAudit]([createdAt]);

-- AddForeignKey (SET NULL instead of the original CASCADE)
ALTER TABLE [dbo].[DocumentAudit] ADD CONSTRAINT [DocumentAudit_documentId_fkey] FOREIGN KEY ([documentId]) REFERENCES [dbo].[Document]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
