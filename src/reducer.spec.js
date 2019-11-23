import { 
  requestsReducer,
  defaultState,
 } from './index';

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

});
