import {
  createMiddleware,
  makeSuccessType,
  makeErrorType,
  makeCancelType,
  fetchCancelRequests,
} from './index';

describe('redux-fetch-requests', ()=>{
  let lastActions;
  const dispatch = jest.fn((action) => {
    lastActions.push(action);
  });
  const store =  {
    dispatch,
  };
  const testAction = {
    type: 'TEST_ACTION',
  };
  const apiAction = {
    type: 'API_ACTION',
    request: {
      url: '/api',
      headers: [
        'Content-type: text/json',
      ],
    },
    meta: {
      id: 100,
    },
  };

  const cancelAction = fetchCancelRequests();

  let isAborted = false;
  const abortController = {
    abort: jest.fn(() => {
      isAborted = true;
    }),
    signal: jest.fn(() => {
    }),
  };

  const next = jest.fn((action) => {
  });

  function AbortError(message) {
    this.name = 'AbortError';
    this.message = message;
  }

  const mockFetch = (response, isReject = false) => jest.fn((url, init) => {
    return new Promise((resolve, reject) => {
      setTimeout(()=>{
        if (isAborted) {
          reject(new AbortError('Abort error'));
        } else if (isReject) {
          reject(response);
        } else {
          resolve(response);
        }
      }, 0);
    })
  });

  const makeResponse = (status, data, isReject = false) => {
    return {
      status,
      statusText: String(status),
      ok: status >= 200 && status <= 299,
      json: () => new Promise((resolve, reject) => {
        return isReject ? reject(data) : resolve(data);
      }),
    }
  };

  const middlewareOptions = {
    baseUrl: '',
    abortController,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    lastActions = [];
    isAborted = false;
  });

  it('should call next middleware', async () => {
    const options = {
      ...middlewareOptions,
      fetchInstance: mockFetch(makeResponse(200, {text: 'hello'})),
    };
    const middleware = createMiddleware(options);
    await middleware(store)(next)(testAction);

    expect(next).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('should call fetch with url arg', async () => {
    const options = {
      ...middlewareOptions,
      baseUrl: 'http://localhost',
      fetchInstance: mockFetch(makeResponse(200, {text: 'hello'})),
    };
    const middleware = createMiddleware(options);
    await middleware(store)(next)(apiAction);

    expect(options.fetchInstance).toHaveBeenCalledWith(
      `${options.baseUrl}${apiAction.request.url}`,
      expect.any(Object));
  });

  it('should call fetch with init arg', async () => {
    const options = {
      ...middlewareOptions,
      baseUrl: 'http://localhost',
      fetchInstance: mockFetch(makeResponse(200, {text: 'hello'})),
    };
    const middleware = createMiddleware(options);
    await middleware(store)(next)(apiAction);

    expect(options.fetchInstance).toHaveBeenCalledWith(
      expect.any(String),
      {
        headers: apiAction.request.headers,
        signal: abortController.signal
      });
  });

  it('should dispatch success action', async () => {
    const options = {
      ...middlewareOptions,
      fetchInstance: mockFetch(makeResponse(200, {text: 'hello'})),
    };
    const middleware = createMiddleware(options);
    await middleware(store)(next)(apiAction);

    expect(dispatch).toHaveBeenCalled();
    const dispatched = lastActions[0];
    expect(dispatched.type).toBe(makeSuccessType(apiAction.type));
    expect(dispatched.response.status).toEqual(200);
    expect(dispatched.response.data).toEqual({text: 'hello'});
    expect(dispatched.meta).toEqual(apiAction.meta);
  });

  it('should dispatch error action', async () => {
    const options = {
      ...middlewareOptions,
      fetchInstance: mockFetch(makeResponse(500, {text: 'error'}), true),
    };
    const middleware = createMiddleware(options);
    await middleware(store)(next)(apiAction);

    expect(dispatch).toHaveBeenCalled();
    const dispatched = lastActions[0];
    expect(dispatched.type).toBe(makeErrorType(apiAction.type));
    expect(dispatched.error.status).toEqual(500);
    expect(dispatched.meta).toEqual(apiAction.meta);
  });

  it('should dispatch error for non-200 status', async () => {
    const options = {
      ...middlewareOptions,
      fetchInstance: mockFetch(makeResponse(500, {text: 'error'})),
    };
    const middleware = createMiddleware(options);
    await middleware(store)(next)(apiAction);

    expect(dispatch).toHaveBeenCalled();
    const dispatched = lastActions[0];
    expect(dispatched.type).toBe(makeErrorType(apiAction.type));
    expect(dispatched.error.status).toEqual(500);
    expect(dispatched.error.data).toEqual({text: 'error'});
  });

  it('should dispatch cancel for aborted call', async () => {
    const options = {
      ...middlewareOptions,
      fetchInstance: mockFetch(makeResponse(200, {text: 'hello'} )),
    };
    const middleware = createMiddleware(options);

    const promise = middleware(store)(next)(apiAction);
    await middleware(store)(next)(cancelAction);
    await promise;

    expect(dispatch).toHaveBeenCalled();
    const dispatched = lastActions[0];
    expect(dispatched.type).toBe(makeCancelType(apiAction.type));
  });

});
