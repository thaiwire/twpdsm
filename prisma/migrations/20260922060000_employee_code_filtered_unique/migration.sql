-- SQL Server's plain UNIQUE constraint treats multiple NULLs as duplicates
-- (unlike Postgres), so any two users without an employeeCode collided on
-- create. Replace it with a filtered unique index that only enforces
-- uniqueness among non-NULL values.
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_employeeCode_key];

CREATE UNIQUE NONCLUSTERED INDEX [User_employeeCode_key]
    ON [dbo].[User]([employeeCode])
    WHERE [employeeCode] IS NOT NULL;
