import type { ApiCall, Query } from './api';

export function get(url: string, params?: Query, query?: Query): ApiCall {
  return { method: 'GET', path: url, params, query };
}

export function post(url: string, payload?: unknown, params?: Query, query?: Query): ApiCall {
  return { method: 'POST', path: url, payload, params, query };
}

export function put(url: string, payload?: unknown, params?: Query, query?: Query): ApiCall {
  return { method: 'PUT', path: url, payload, params, query };
}

export function patch(url: string, payload?: unknown, params?: Query, query?: Query): ApiCall {
  return { method: 'PATCH', path: url, payload, params, query };
}

export function remove(url: string, params?: Query, query?: Query): ApiCall {
  return { method: 'DELETE', path: url, params, query };
}

export const urls = {
  hello: () => get('/'),
};
