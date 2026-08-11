export interface SyncService {
  push(): Promise<void>
  pull(): Promise<void>
  resolveConflicts(): Promise<void>
}

export class LocalSyncService implements SyncService {
  async push(): Promise<void> {
    return
  }

  async pull(): Promise<void> {
    return
  }

  async resolveConflicts(): Promise<void> {
    return
  }
}
