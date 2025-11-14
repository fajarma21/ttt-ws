export interface VerifyInfo {
  origin: string;
}

export type VerifyCallback = (
  res: boolean,
  code?: number,
  message?: string
) => void;
