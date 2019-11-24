import { 
  requestsReducer,
  defaultState,
  makeSuccessType,
  makeErrorType,
  makeCancelType,
 } from './index';
import { JestEnvironment } from '@jest/environment';

describe('reducer', () => {
  const GET_FILE = 'GET_FILE';
  const getFileAction = (id) =>({
    type: GET_FILE,
    payload: {
      id,
    },
  });
  
  const getFileResponse = (name, id) => ({multiple}) => {
    const file = {
      name,
      id,
    }
    return multiple ? [file] : file;
  };

  it ('should create initial state', () => {
    const options = {};
    const reducer = requestsReducer(options);
    const state = reducer(undefined, {});
    expect(state).toEqual(defaultState());
  });

  it ('should set initial data function', () => {
    const options = { getDefaultData: getFileResponse('File', 1) };
    const reducer = requestsReducer(options);
    const state = reducer(undefined, {});
    expect(state).toEqual(defaultState(options));
  });

  it ('should create initial multiple state', () => {
    const options = { multiple: true };
    const reducer = requestsReducer(options);
    const state = reducer(undefined, {});
    expect(state).toEqual(defaultState(options));
    expect(state.data).toEqual([]);
  });

  it ('should create initial multiple state', () => {
    const options = {
      multiple: true,
      getDefaultData: getFileResponse('File', 1),
    };
    const reducer = requestsReducer(options);
    const state = reducer(undefined, {});
    expect(state).toEqual(defaultState(options));
    expect(state.data).toEqual([{name:'File', id:1}]);
  });

  it ('should keep state for unknown action', () => {
    const options = { getDefaultData: getFileResponse('File', 1) };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const state = reducer(prevState, {});
    expect(state).toEqual(prevState);
  });

  it ('should set pending for request action', () => {
    const options = { actionType: GET_FILE, getDefaultData: getFileResponse() };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const state = reducer(prevState, getFileAction(1));
    expect(state).toEqual({
      ...prevState,
      pending: 1,
    });
  });

  it ('should set success data', () => {
    const options = { actionType: GET_FILE, getDefaultData: getFileResponse() };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const action = { 
      type: makeSuccessType(GET_FILE),
      data: getFileResponse('File', 1)({}),
    };
    const state = reducer(prevState, action);
    expect(state).toEqual({
      ...prevState,
      data: action.data,
      pending: -1,
    });
  });

  it ('should set error data', () => {
    const options = { actionType: GET_FILE, getDefaultData: getFileResponse() };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const action = { 
      type: makeErrorType(GET_FILE),
      error: {status:404, statusMessage:'Not found'},
    };
    const state = reducer(prevState, action);
    expect(state).toEqual({
      ...prevState,
      error: action.error,
      pending: -1,
    });
  });

  it ('should set cancel data', () => {
    const options = { actionType: GET_FILE, getDefaultData: getFileResponse() };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const action = { 
      type: makeCancelType(GET_FILE),
      error: {name: 'AbortError', status:500, statusMessage:'No connection'},
    };
    const state = reducer(prevState, action);
    expect(state).toEqual({
      ...prevState,
      error: action.error,
      pending: -1,
    });
  });

  it ('should process success data with getData', () => {
    const options = {
      actionType: GET_FILE,
      getDefaultData: getFileResponse(),
      getData: jest.fn((state, action, options) => ({
        ...action.data,
        tenantId: 42,
      }))
    };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const action = { 
      type: makeSuccessType(GET_FILE),
      data: getFileResponse('File', 1)({}),
    };
    const state = reducer(prevState, action);
    expect(state).toEqual({
      ...prevState,
      data: {
        ...action.data,
        tenantId: 42,
      },
      pending: -1,
    });
    expect(options.getData).toHaveBeenCalledWith(
      prevState,
      action,
      options,
    );

  });

  it ('should porocess error data with getError', () => {
    const options = {
      actionType: GET_FILE,
      getDefaultData: getFileResponse(),
      getError: jest.fn((state, action, options) => ({
        ...action.error,
        tenantId: 42,
      }))
    };
    const reducer = requestsReducer(options);
    const prevState = defaultState(options);
    const action = { 
      type: makeErrorType(GET_FILE),
      error: {status:404, statusMessage:'Not found'},
    };
    const state = reducer(prevState, action);
    expect(state).toEqual({
      ...prevState,
      error: {
        ...action.error,
        tenantId: 42,
      },
      pending: -1,
    });
    expect(options.getError).toHaveBeenCalledWith(
      prevState,
      action,
      options,
    );
  });

  it ('should reset to default state on resetOn action', () => {
    const options = {
      actionType: GET_FILE,
      getDefaultData: getFileResponse(),
      resetOn: ['RESET'],
    };
    const reducer = requestsReducer(options);
    const initialState = defaultState(options);
    const action = { 
      type: makeSuccessType(GET_FILE),
      data: getFileResponse('File', 1)({}),
    };
    const resetAction = {
      type: 'RESET',
    };
    const prevState = reducer(initialState, action);
    const state = reducer(prevState, resetAction);
    expect(state).toEqual(initialState);
  });

  it ('should reset to default state on resetOn functor', () => {
    const options = {
      actionType: GET_FILE,
      getDefaultData: getFileResponse(),
      resetOn: (action) => action.type === 'RESET',
    };
    const reducer = requestsReducer(options);
    const initialState = defaultState(options);
    const action = { 
      type: makeSuccessType(GET_FILE),
      data: getFileResponse('File', 1)({}),
    };
    const resetAction = {
      type: 'RESET',
    };
    const prevState = reducer(initialState, action);
    const state = reducer(prevState, resetAction);
    expect(state).toEqual(initialState);
  });

  it ('should reset to default state when resetOn is the same as actionType', () => {
    const options = {
      actionType: GET_FILE,
      getDefaultData: getFileResponse(),
      resetOn: [GET_FILE],
    };
    const reducer = requestsReducer(options);
    const initialState = defaultState(options);
    const action = { 
      type: makeSuccessType(GET_FILE),
      data: getFileResponse('File', 1)({}),
    };
    const resetAction = getFileAction(1);
    const prevState = reducer(initialState, action);
    const state = reducer(prevState, resetAction);
    expect(state).toEqual({
      ...initialState,
      pending: 1,
    });
  });

});
