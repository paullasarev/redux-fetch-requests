import { has } from 'lodash/fp';
import { isFunction } from 'lodash';

const FETCH_CANCEL_REQUESTS = 'FETCH_CANCEL_REQUESTS';

function fetchCancelRequests() {
  return {
    type: FETCH_CANCEL_REQUESTS,
  }
}

const hasRequest = has('request');

const responseTypes = ['arraybuffer', 'blob', 'formData', 'json', 'text', null];

function makeSuccessType(type) {
  return `${type}_SUCCESS`;
}

function makeErrorType(type) {
  return `${type}_ERROR`;
}

function makeCancelType(type) {
  return `${type}_CANCEL`;
}

function getResponseData(response, responseType) {
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

function isAbortError(err) {
  return err.name === 'AbortError';
}

async function fetchData(action, dispatch, options) {
  const {
    fetchInstance,
    baseUrl,
    abortController,
    onRequest,
    onSuccess,
    onError,
    onCancel,
  } = options;
  const {
    request: {
      url,
      responseType = 'json',
      isCancellable = true,
      ...requestInit
    },
    meta,
  } = action;
  try {
    const signal = (isCancellable && abortController) ? { signal: abortController.signal } : undefined;
    const init = isFunction(onRequest) ? onRequest(requestInit, action, dispatch) : requestInit;
    const response = await fetchInstance(`${baseUrl}${url}`, {...signal, ...init});

    if (response.ok) {
      response.data = await getResponseData(response, responseType);
      const resp = isFunction(onSuccess) ? onSuccess(response, action, dispatch) : response;
      return dispatch({
        type: makeSuccessType(action.type),
        response: resp,
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
      handler(error, action, dispatch);
    }
    return dispatch({
      type,
      error,
      meta,
    });
  }
}

function createMiddleware (options) {
  const {
    fetchInstance = fetch,
    baseUrl = '/',
    abortController = new AbortController(),
    onRequest,
    onSuccess,
    onError,
    onCancel,
  } = options;

  return ({ dispatch }) => (next) => (action) => {

    if (action.type === FETCH_CANCEL_REQUESTS) {
      abortController.abort();
      return next(action);
    }

    if (hasRequest(action)) {
      return fetchData(action, dispatch, {
        fetchInstance,
        baseUrl,
        abortController,
        onRequest,
        onSuccess,
        onError,
        onCancel,
      });
    }

    return next(action);
  };
}

export { FETCH_CANCEL_REQUESTS, createMiddleware, fetchCancelRequests, fetchData, getResponseData, isAbortError, makeCancelType, makeErrorType, makeSuccessType };
