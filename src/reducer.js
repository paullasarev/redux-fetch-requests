import { isUndefined, isFunction, isArray } from 'lodash';

import {
  makeSuccessType,
  makeErrorType,
  makeCancelType,
} from './middleware';

export const defaultState = (options = {}) => {
  const {
    getDefaultData,
    multiple = false,
  } = options;
  let data = multiple ? [] : null;
  if (isFunction(getDefaultData)) {
    data = getDefaultData(options)
  }
  return {
    data,
    error: null,
    pending: 0,
  }
};

export function requestsReducer(options = {}) {
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
