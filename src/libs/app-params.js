const isNode = typeof window === 'undefined';

const memoryStorage = {
	store: new Map(),
	getItem(key) {
		return this.store.has(key) ? this.store.get(key) : null;
	},
	setItem(key, value) {
		this.store.set(key, String(value));
	},
	removeItem(key) {
		this.store.delete(key);
	},
};

const getStorage = () => {
	if (isNode) return memoryStorage;
	try {
		if (window.localStorage) return window.localStorage;
	} catch {
		// Fallback for restricted environments.
	}
	return memoryStorage;
};

const storage = getStorage();
const viteEnv = /** @type {any} */ (import.meta).env || {};
const DEFAULT_BASE44_APP_ID = '69d391e96fadb0c27d8ef176';

const normalizeParamValue = (value) => {
	if (value === undefined || value === null) return null;
	const trimmed = String(value).trim();
	if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') return null;
	return trimmed;
};

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) return defaultValue;

	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);

	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}

	if (searchParam !== null) {
		const normalized = normalizeParamValue(searchParam);
		if (normalized) {
			storage.setItem(storageKey, normalized);
			return normalized;
		}
		storage.removeItem(storageKey);
		// Keep resolving from defaults/storage when URL contains invalid values like "null".
	}

	if (defaultValue !== undefined && defaultValue !== null) {
		const normalized = normalizeParamValue(defaultValue);
		if (normalized) {
			storage.setItem(storageKey, normalized);
			return normalized;
		}
	}

	const storedValue = normalizeParamValue(storage.getItem(storageKey));
	if (storedValue) return storedValue;

	storage.removeItem(storageKey);
	return null;
};

const getAppParams = () => {
	if (getAppParamValue('clear_access_token') === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}

	return {
		appId: getAppParamValue('app_id', { defaultValue: viteEnv.VITE_BASE44_APP_ID || DEFAULT_BASE44_APP_ID }),
		token: getAppParamValue('access_token', { removeFromUrl: true }),
		fromUrl: getAppParamValue('from_url', { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue('functions_version', { defaultValue: viteEnv.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue('app_base_url', { defaultValue: viteEnv.VITE_BASE44_APP_BASE_URL }),
	};
};

export const appParams = {
	...getAppParams(),
};
