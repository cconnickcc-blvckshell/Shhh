export class InitiationCapReachedError extends Error {
  statusCode = 429;
  code = 'INITIATION_CAP_REACHED';
  cap: number;
  used: number;
  tierOptions: string[];

  constructor(cap: number, used: number, tierOptions: string[]) {
    super('Connection window reached for this view. Change filters or refresh to see more.');
    this.name = 'InitiationCapReachedError';
    this.cap = cap;
    this.used = used;
    this.tierOptions = tierOptions;
  }
}
