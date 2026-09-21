import { Router } from '@angular/router';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';
import { CurrentUserAuth } from 'src/app/response-type/Type';

export interface ResolvedStoreContext {
  store: Store;
  company?: Company;
  isOwner: boolean;
}

export interface StoreNavigationState {
  store?: Store;
  company?: Company;
  isUpdateMode?: boolean;
  procurement?: unknown;
}

export const OWNER_STORES_ROUTE = '/index/owner/stores';
export const OWNER_STORE_VIEW_ROUTE = '/index/owner/store';
export const MANAGER_HOME_ROUTE = '/index/manager/home';
export const MANAGER_PROCUREMENT_LIST_ROUTE =
  '/index/manager/procurement/list';

/** Lit le state de navigation (store, company, mode édition, etc.). */
export function readStoreNavigationState(
  state: unknown = history.state
): StoreNavigationState {
  return (state ?? {}) as StoreNavigationState;
}

/**
 * Résout store + company selon le rôle :
 * - Owner : depuis history.state (navigation depuis une boutique)
 * - Manager / Seller : depuis la réponse auth
 */
export function resolveStoreContext(
  auth: CurrentUserAuth,
  navState: StoreNavigationState = readStoreNavigationState()
): ResolvedStoreContext | null {
  const roleName = auth.user?.role?.name?.toLowerCase();

  if (roleName === 'owner') {
    if (navState.store && navState.company) {
      return {
        store: navState.store,
        company: navState.company,
        isOwner: true
      };
    }
    return null;
  }

  if (!auth.store) {
    return null;
  }

  return {
    store: auth.store,
    company: auth.company,
    isOwner: false
  };
}

/** Navigation retour adaptée au rôle. */
export function navigateStoreBack(
  router: Router,
  options: {
    isOwner: boolean;
    store?: Store;
    company?: Company | null;
    managerFallbackRoute?: string;
  }
): void {
  const {
    isOwner,
    store,
    company,
    managerFallbackRoute = MANAGER_HOME_ROUTE
  } = options;

  if (isOwner) {
    if (store && company) {
      router.navigate([OWNER_STORE_VIEW_ROUTE], {
        state: { store, company }
      });
    } else {
      router.navigate([OWNER_STORES_ROUTE]);
    }
    return;
  }

  router.navigate([managerFallbackRoute]);
}

/** Navigation vers la liste des approvisionnements (avec state pour owner). */
export function navigateToProcurementList(
  router: Router,
  store: Store,
  company?: Company | null
): void {
  router.navigate([MANAGER_PROCUREMENT_LIST_ROUTE], {
    state: company ? { store, company } : { store }
  });
}
