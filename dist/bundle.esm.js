import { has } from 'lodash/fp';
import { isFunction, isArray, isUndefined } from 'lodash';

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
    cancelOn = [FETCH_CANCEL_REQUESTS],
  } = options;

  return ({ dispatch }) => (next) => (action) => {

    if (isArray(cancelOn) && cancelOn.indexOf(action.type) >= 0) {
      abortController.abort();
      return next(action);
    }    
    if (isFunction(cancelOn) && cancelOn(action)) {
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

const defaultState = (options = {}) => {
  const {
    getDefaultData,
    multiple = false,
  } = options;
  let data = multiple ? [] : null;
  if (isFunction(getDefaultData)) {
    data = getDefaultData(options);
  }
  return {
    data,
    error: null,
    pending: 0,
  }
};

function requestsReducer(options = {}) {
  const {
    actionType = 'UNKNOWN_ACTION',
    getData,
    getError,
    resetOn,
  } = options;
  const actionSuccessType = makeSuccessType(actionType);
  const actionErrorType = makeErrorType(actionType);
  const actionCancelType = makeCancelType(actionType);

  return (prevState, action) => {
    let state = prevState;
    if (isUndefined(prevState)) {
      state = defaultState(options);
    }
    if (isArray(resetOn) && resetOn.indexOf(action.type) >= 0) {
      state = defaultState(options);
    }
    if (isFunction(resetOn) && resetOn(action)) {
      state = defaultState(options);
    }

    switch(action.type) {
      case actionType: {
        return {
          ...state,
          pending: state.pending + 1,
        };
      }
      case actionSuccessType: {
        const data = isFunction(getData) ? getData(state, action, options) : action.data;
        return {
          ...state,
          data,
          pending: state.pending - 1,
        };
      }
      case actionCancelType:
      case actionErrorType: {
        const error = isFunction(getError) ? getError(state, action, options) : action.error;
        return {
          ...state,
          error,
          pending: state.pending - 1,
        };
      }
      default:
        return state;
    }
  }
}

export { FETCH_CANCEL_REQUESTS, createMiddleware, defaultState, fetchCancelRequests, fetchData, getResponseData, isAbortError, makeCancelType, makeErrorType, makeSuccessType, requestsReducer };
