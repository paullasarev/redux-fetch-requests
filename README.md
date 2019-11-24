# redux-fetch-requests
Redux middleware to simplify handling of AJAX requests

## Motivation

Using the *redux-fetch-requests* it's possible to get rid of plumber code and concentrate on API call results proceccing in case when you use the *redux* flow.

The **redux-fetch-requests** library is inspired by great **redux-saga-requests**, but does not require the *redux-saga* to use and is much smaller and a bit simplier in usage. Moreover, the **redux-fetch-requests** works *only* with browser fetch API.

The **redux-fetch-requests** middleware takes responsibility for:

## process API-specific **redux** actions (it's an action with the *request* object)

### attach the middleware to store
```js
import { createStore, applyMiddleware } from 'redux';
import { createMiddleware } from 'redux-fetch-requests';

const fetchRequestsOptions = {
  // fetchInstance = fetch,
  baseUrl: '/api', // baseUrl = ''
  // abortController = new AbortController()
  // cancelOn = [FETCH_CANCEL_REQUESTS],
  // onRequest = undefined,
  // onSuccess = undefined,
  // onError = undefined,
  // onCancel = undefined,
};

const store = createStore(
  rootReducer,
  applyMiddleware(
    createMiddleware(options),
  ),
);

```

### process actions with **request** section
  
```js
const GET_BOOKS = 'GET_BOOKS';
const getBooks() {
  return {
    type: GET_BOOKS,
    request: {
      url: '/books',
    }
  }
}
```
will produce call like
```log
GET http://localhost/api/books
```

### add query params  
```js
const GET_BOOKS = 'GET_BOOKS';
const getBooks(name) {
  return {
    type: GET_BOOK,
    request: {
      url: '/books',
      query: {
        name,
      }
    }
  }
}
```
```log
GET http://localhost/api/books?name=asdf
```

### specify the HTTP method

```js
const DELETE_BOOK = 'DELETE_BOOK';
const deleteBook(id) {
  return {
    type: DELETE_BOOK,
    request: {
      url: `/books/${id}`,
      method: 'DELETE',
    }
    meta: {
      id,
    }
  }
}
```
```log
DELETE http://localhost/api/books/10
```

```js
const ADD_BOOK = 'ADD_BOOK';
const addBook(title, description, ISBN) {
  return {
    type: ADD_BOOK,
    request: {
      url: `/books`,
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        ISBN,
      })
    }
  }
}
```
```log
POST http://localhost/api/books/10

{"title":"title","description":"description","ISBN":"2-266-11156-6"}
```


### process fetch **success** flow
  * decode required response type (json, blob, formData, text, arrayBuffer)
  * fire correspond redux action (<ACTION_TYPE>_SUCCESS) with decoded data
  * pass the **meta** section from initial API action to the success action

```js
const DELETE_BOOK = 'DELETE_BOOK';
const deleteBook(id) {
  return {
    type: DELETE_BOOK,
    request: {
      url: `/books/${id}`,
      method: 'DELETE',
    }
    meta: {
      id,
    }
  }
}
```

success action:
```js
{
  type: 'DELETE_BOOK_SUCCESS',
  response: { 
    data: 'some data'
    status: 200,
    statusMessage: 'OK'
  },
  data: 'some data',
  meta: {
    id: 1,
  },
}
```

### process fetch **error** flow
  * generate an error when HTTP result code is not 200..299
  * try to decode response data via json() helper
  * fire correspond redux action (<ACTION_TYPE>_ERROR) with decoded data
  * pass the **meta** section from initial API action to the error action

error action:
```js
{
  type: 'DELETE_BOOK_ERROR',
  error: { 
    data: 'something went wrong'
    status: 500,
    statusMessage: 'internal error'
  },
  meta: {
    id: 1,
  },
}
```

### process fetch **abort** flow
  * instantiate AbortController in the middleware to proceed request cancelling
  * pass **signal** to the **fetch** call (is controlled by isCancelling request flag)
  * watch **cancelling** action (can be defined as an action types array or via a function)
  * on cancelling action call AbortController abort() which leads cancelling all active **fetch** requests
  * fire correspond redux action (<ACTION_TYPE>_CANCEL) with error definition

cancel action:
```js
{
  type: 'DELETE_BOOK_CANCEL',
  error: { 
    name: 'AbortError',
    message: 'request aborted',
  },
  meta: {
    id: 1,
  },
}
```

## provides an **interceptors** for request/response processing

### onRequest 
* it's possible to modify the Request before call
* for example, to add some auth headers

```js
const reduxFetchOptions = {
  onRequest: (request, action, dispatch, getState, options) => {
    return {
      ...request,
      headers: {
        Authorization: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l',
      }
    }
  }
}
```

### onSuccess
    * it's possible to provide some common response data processing if required
    * it's possible to fire a **redux** action if required

```js
const reduxFetchOptions = {
  onSuccess: (response, action, dispatch, getState, options) => {
    // do sth with the response, dispatch some action etc
    return response;
  }
}
```

### onError 
    * it's possible to fire a **redux** action if required

```js
const reduxFetchOptions = {
  onError: (error, action, dispatch, getState, options) => {
    // do sth here like dispatch some action
    if (error.status === 404) {
      dispatch(popupAction('no access'));
    }
  }
}
```

### onCancel
    * it's possible to fire a **redux** action if required

```js
const reduxFetchOptions = {
  onCancel: (error, action, dispatch, getState, options) => {
    // do sth here like dispatch some action
  }
}
```

## Reducer helper
The second part of **redux-fetch-requests** is a **reducer** helper which allows to get rid of plumber code for API requests processing in reducers.

The **redux-fetch-request** **requestsReducer** helper:

### process defined <ACTION_TYPE> as well as correspond success, error and cancel actions

*  initialize default state with object like {data,erro,pending}

```js
export default const reducer = requestsReducer({
  actionType: GET_BOOK
});
```

initial state:
```js
{
  data: null,
  error: null,
  pending: 0,
}
```

### keeps the **pending** field in accordance with request/(success|error|cancel) counter
```js
// state after GET_BOOK
{
  data: null,
  error: null,
  pending: 1,
}
```
```js
// state after GET_BOOK_SUCCESS
{
  data: {...},
  error: null,
  pending: 0,
}
```
```js
// state after GET_BOOK_ERROR/GET_BOOK_CANCEL
{
  data: null,
  error: {},
  pending: 0,
}
```

### allows to work with arrays

```js
export default const reducer = requestsReducer({
  actionType: GET_BOOKS
  multiple: true,
});
```
initial state:
```js
{
  data: [],
  error: null,
  pending: 0,
}
```

### allows to define default data object via getDefaultData option
```js
export default const reducer = requestsReducer({
  actionType: GET_BOOK,
  getDefaultData: (options) => ({title:''})
});
```

```js
// state after GET_BOOK_SUCCESS
{
  data: {title: 'cool book'},
  error: null,
  pending: 0,
}
```
```js
// initial state:
{
  data: {title: ''},
  error: null,
  pending: 0,
}
```

### allows to define result data processing via getData option
```js
export default const reducer = requestsReducer({
  actionType: GET_BOOK,
  getData: (state, action, options) => ({
    ...action.data,
    section: 'Fiction',
  }),
});
```

```js
// state after GET_BOOK_SUCCESS
{
  data: { title: 'cool book', section: 'Fiction' },
  error: null,
  pending: 0,
}
```

### allows to define error data processing via getError option

```js
export default const reducer = requestsReducer({
  actionType: GET_BOOK,
  getError: (state, action, options) => new CustomError(action.error),
});
```

```js
// state after GET_BOOK_ERROR
{
  data: null,
  error: CustomError,
  pending: 0,
}
```
### allows to define action(s) to reset store to initial state (this action can be the same as Request)
```js
export default const reducer = requestsReducer({
  actionType: GET_BOOK,
  getDefaultData: (options) => ({title:''}),
  resetOn: [GET_BOOK],
});
```

```js
// state before GET_BOOK
{
  data: {title: 'cool book},
  error: null,
  pending: 0,
}
```
```js
// state after GET_BOOK
{
  data: {title: ''},
  error: null,
  pending: 1,
}
```

## License

**MIT**
