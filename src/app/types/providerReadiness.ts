export type ProviderReadiness = {
  configured: boolean;
  provider: string | null;
  source: string | null;
  message: string;
};

export type ProviderReadinessState = {
  loading: boolean;
  readiness: ProviderReadiness | null;
  error: string | null;
};

export type FutureAiApproval = {
  eligibleWhenImplemented: boolean;
  disabledReasons: string[];
};
