import { ha, get } from 'lodash/fp';

const hasRequest = has('request');
const hasMeta = has('meta');

const responseTypes = ['arraybuffer', 'blob', 'formData', 'json', 'text', null];

const getResponseData = (response, responseType) => {
  if (responseTypes.indexOf(responseType) === -1) {
    throw new Error(
        "responseType must be one of the following: 'arraybuffer', 'blob', 'formData', 'json', 'text', null",
    );
  }

  if (responseType === null) {
    return Promise.resolve(null);
  }

  return response[responseType]();
};

export function makeSuccessType(type) {
  return `${type}_SUCCESS`;
}

export function makeErrorType(type) {
  return `${type}_SUCCESS`;
}

export function createMiddleware (options) {
  const {
    fetchInstance = fetch,
    baseUrl = '/',
  } = options;
  return (store) => (next) => (action) => {
    const { dispatch, getState } = store;
    if (hasRequest(action)) {
      const {
        request: {
          url,
          method = 'GET',
          responseType = 'json',
        },
        meta,
      } = action;
      return fetchInstance(
          `${baseUrl}${url}`,
          {
            // signal: abortSource.signal
          },
        )
        .then(response => {
          if (response.ok) {
            return getResponseData(response, responseType);
          }

          return response.json()
            .then(data => {
              response.data = data;
              throw response;
            })
            .catch(e => {
              throw response;
            })
          ;
          // throw response;

          // try {
          //   // response.data = await response.json();
          //   return response.json()
          //     .then( data => {
          //       dispatch({
          //         type: makeErrorType(action.type),
          //         error: response,
          //         data,
          //         meta,
          //       });
          //     })
          //   ;
          // } catch (e) {
          //   dispatch({
          //     type: makeErrorType(action.type),
          //     error: response,
          //     meta,
          //   });
          // }

        })
        .then(data => {
          dispatch({
            type: makeSuccessType(action.type),
            data,
            meta,
          });
        })
        .catch(error => {
          dispatch({
            type: makeErrorType(action.type),
            error,
            meta,
          });
        })
      ;
    }

    return next(action);
  };
}


