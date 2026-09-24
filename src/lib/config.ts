const DEFAULT_DOCUMENTS_PAGE_SIZE = 20;

export const DOCUMENTS_PAGE_SIZE = (() => {
  const parsed = Number(process.env.DOCUMENTS_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DOCUMENTS_PAGE_SIZE;
})();

const DEFAULT_AUDIT_LOG_PAGE_SIZE = 30;

export const AUDIT_LOG_PAGE_SIZE = (() => {
  const parsed = Number(process.env.AUDIT_LOG_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_AUDIT_LOG_PAGE_SIZE;
})();
