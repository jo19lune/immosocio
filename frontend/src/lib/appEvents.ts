export const APP_REFRESH_EVENT = 'app:refresh';

export type RefreshScope =
  | '*'
  | 'annonces'
  | 'publications'
  | 'messages'
  | 'notifications'
  | 'reservations'
  | 'profile'
  | 'layout';

export interface AppRefreshDetail {
  scopes: RefreshScope[];
  source?: 'local' | 'websocket';
  payload?: unknown;
}

export function emitAppRefresh(
  scopes: RefreshScope | RefreshScope[],
  detail: Omit<AppRefreshDetail, 'scopes'> = {},
) {
  const normalizedScopes = Array.isArray(scopes) ? scopes : [scopes];
  window.dispatchEvent(new CustomEvent<AppRefreshDetail>(APP_REFRESH_EVENT, {
    detail: { ...detail, scopes: normalizedScopes },
  }));
}

export function shouldHandleRefresh(
  requestedScopes: RefreshScope[],
  incomingScopes: RefreshScope[],
) {
  return requestedScopes.includes('*')
    || incomingScopes.includes('*')
    || requestedScopes.some((scope) => incomingScopes.includes(scope));
}

export function getRefreshScopesFromPayload(payload: any): RefreshScope[] {
  switch (payload?.type) {
    case 'NOUVEAU_MESSAGE':
    case 'MESSAGE':
      return ['messages', 'notifications', 'layout'];
    case 'NOUVEAU_LIKE':
    case 'NOUVEAU_COMMENTAIRE':
      return ['publications', 'profile', 'notifications', 'layout'];
    case 'RESERVATION_CONFIRMEE':
    case 'RESERVATION_ANNULEE':
    case 'NOUVELLE_ANNONCE':
      return ['annonces', 'reservations', 'notifications', 'layout'];
    default:
      return ['notifications', 'layout'];
  }
}
