import {
  createMiddleware,
  makeSuccessType,
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
    }
  };

  const abortController = {
    abort: jest.fn(() => {
    }),
  };

  const next = jest.fn((action) => {
  });

  const mockFetch = (response) => (url, init) => {
    return new Promise((resolve, reject) => {
      resolve(response);
    })
  };

  const makeResponse = (status, data) => {
    return {
      status,
      statusText: String(status),
      ok: status >= 200 && status <= 299,
      json: () => new Promise((resolve) => { resolve(data); }),
    }
  };

  const middlewareOptions = {
    fetchInstance: mockFetch(makeResponse(200, {text: 'hello'})),
    baseUrl: '',
    abortController,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    lastActions = [];
  });

  it('should call next middleware', async () => {
    const middleware = createMiddleware(middlewareOptions);
    const result = await middleware(store)(next)(testAction);
    expect(next).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('should dispatch success action', async () => {
    const middleware = createMiddleware(middlewareOptions);
    const result = await middleware(store)(next)(apiAction);
    expect(dispatch).toHaveBeenCalled();
    const dispatched = lastActions[0];
    expect(dispatched.type).toBe(makeSuccessType(apiAction.type));
    expect(dispatched.response.data).toEqual({text: 'hello'});
  });
});
