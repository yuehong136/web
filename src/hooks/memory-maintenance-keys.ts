export const memoryMaintenanceKeys = {
  bank: (memoryId: string) => ['memory-maintenance', memoryId] as const,
  jobs: (memoryId: string) =>
    [...memoryMaintenanceKeys.bank(memoryId), 'jobs'] as const,
  job: (memoryId: string, jobId: string) =>
    [...memoryMaintenanceKeys.bank(memoryId), 'job', jobId] as const,
  candidates: (memoryId: string, jobId: string) =>
    [...memoryMaintenanceKeys.bank(memoryId), 'candidates', jobId] as const,
  withdrawals: (memoryId: string) =>
    [...memoryMaintenanceKeys.bank(memoryId), 'withdrawal'] as const,
  withdrawal: (memoryId: string, sourceId: string) =>
    [...memoryMaintenanceKeys.withdrawals(memoryId), sourceId] as const,
}
