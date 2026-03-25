import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_ONLY_KEY = 'adminOnly';

/** Require an ADMIN-role API key. Must be used together with @Public() being absent. */
export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY_KEY, true);
