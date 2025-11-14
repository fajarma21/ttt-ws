import type { VerifyCallback, VerifyInfo } from './index.types';

export const wsVerification = async (
  info: VerifyInfo,
  done: VerifyCallback
) => {
  const allowdOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowdOrigin) {
    done(true);
    return;
  }

  const origin = info.origin;
  if (origin === allowdOrigin) done(true);
  else done(false, 403, 'Forbidden');
};
