/*
  Backfill DocumentAudit.documentNumber/documentTitle for existing rows from
  their still-existing Document, then enforce NOT NULL now that every row has
  a value.
*/
BEGIN TRY

BEGIN TRAN;

UPDATE [a]
SET [a].[documentNumber] = [d].[documentNumber],
    [a].[documentTitle] = [d].[title]
FROM [dbo].[DocumentAudit] AS [a]
INNER JOIN [dbo].[Document] AS [d] ON [d].[id] = [a].[documentId]
WHERE [a].[documentNumber] IS NULL;

-- Any row without a matching Document (shouldn't exist pre-migration, since
-- documentId was NOT NULL + CASCADE until now) gets a placeholder so the
-- NOT NULL constraint below can be applied safely.
UPDATE [dbo].[DocumentAudit]
SET [documentNumber] = N'(unknown)',
    [documentTitle] = N'(unknown)'
WHERE [documentNumber] IS NULL;

ALTER TABLE [dbo].[DocumentAudit] ALTER COLUMN [documentNumber] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[DocumentAudit] ALTER COLUMN [documentTitle] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
