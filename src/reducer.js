import { isUndefined, isFunction } from "util";

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
  } = options;
  return (state, action) => {
    if (isUndefined(state)) {
      return defaultState(options);
    }

    switch(action.type) {
      case actionType: {
        return {
          ...state,
          pending: state.pending + 1,
        };
      }
      default:
        return state;
    }
  }
}
