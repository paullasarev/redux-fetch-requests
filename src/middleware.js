import { has } from 'lodash/fp';
import { isFunction, isArray } from 'lodash';
import { encode } from 'querystring';

import { FETCH_CANCEL_REQUESTS } from './actions';

const hasRequest = has('request');

const responseTypes = ['arraybuffer', 'blob', 'formData', 'json', 'text', null];

export function makeSuccessType(type) {
  return `${type}_SUCCESS`;
}

export function makeErrorType(type) {
  return `${type}_ERROR`;
}

export function makeCancelType(type) {
  return `${type}_CANCEL`;
}

export function getResponseData(response, responseType) {
  if (responseTypes.indexOf(responseType) === -1) {
    throw new Error(
      `responseType must be one of the following: ${responseTypes.map(String).join(', ')}`,
    );
  }

  if (responseType === null) {
    return Promise.resolve(null);
  }

  return response[responseType]();
}

export function isAbortError(err) {
  return err.name === 'AbortError';
}

export async function fetchData(action, dispatch, getState, options) {
  const {
    fetchInstance = fetch,
    baseUrl = '',
    abortController,
    onRequest,
    onSuccess,
    onError,
    onCancel,
  } = options;
  const {
    request: {
      url,
      query = {},
      responseType = 'json',
      isCancellable = true,
      ...requestInit
    },
    meta,
  } = action;
  try {
    const signal = (isCancellable && abortController) ? { signal: abortController.signal } : undefined;
    const init = isFunction(onRequest) ? onRequest(requestInit, action, dispatch, getState, options) : requestInit;
    const queryString = encode(query);
    const fetchUrl = `${baseUrl}${url}${queryString ? '?'+queryString : ''}`
    
    const response = await fetchInstance(fetchUrl, {...signal, ...init});

    if (response.ok) {
      response.data = await getResponseData(response, responseType);
      const resp = isFunction(onSuccess) ? onSuccess(response, action, dispatch, getState, options) : response;
      return dispatch({
        type: makeSuccessType(action.type),
        response: resp,
        data: resp.data,
        meta,
      });
    }

    try {
      response.data = await response.json();
    } catch (e) {
      // no response data from server
    }
    throw response;

  } catch(error) {
    const isAbort = isAbortError(error);
    const type = isAbort ? makeCancelType(action.type) : makeErrorType(action.type);
    const handler = isAbort ? onCancel : onError;
    if (isFunction(handler)) {
      handler(error, action, dispatch, getState, options);
    }
    return dispatch({
      type,
      error,
      meta,
    });
  }
}

export function createMiddleware (options) {
  const {
    abortController = new AbortController(),
    cancelOn = [FETCH_CANCEL_REQUESTS],
  } = options;

  return ({ dispatch, getState }) => (next) => (action) => {

    if (isArray(cancelOn) && cancelOn.indexOf(action.type) >= 0) {
      abortController.abort();
      return next(action);
    }    
    if (isFunction(cancelOn) && cancelOn(action)) {
      abortController.abort();
      return next(action);
    }

    if (hasRequest(action)) {
      return fetchData(action, dispatch, getState, options);
    }

    return next(action);
  };
}


