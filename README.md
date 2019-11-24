# redux-fetch-requests
Redux middleware to simplify handling of AJAX requests

## Motivation

Using the *redux-fetch-requests* it's possible to get rid of plumber code and concentrate on API call results proceccing in case when you use the *redux* flow.

The **redux-fetch-requests** library is inspired by great **redux-saga-requests**, but does not require the *redux-saga* and is much smaller and a bit simplier in usage. Moreover, the **redux-fetch-requests** works *only* with browser fetch API.

The **redux-fetch-requests** middleware takes responsibility for:
* process API-specific **redux** actions (it's an action with the *request* object)
* call the **fetch** API
  * instantiate AbortController if required
* process **fetch** success flow
  * decode required response type (json, blob, formData, text, arrayBuffer)
  * fire correspond redux action (<ACTION_TYPE>_SUCCESS) with decoded data
  * pass the **meta** section from initial API action to the success action
* process **fetch** error flow
  * generate an error when HTTP result code is not 200..299
  * try to decode response data via json() helper
  * fire correspond redux action (<ACTION_TYPE>_ERROR) with decoded data
  * pass the **meta** section from initial API action to the error action
* process **fetch** abort flow
  * instantiate an AbortController in middleware
  * pass **signal** to the **fetch** call (is controlled by isCancelling request flag)
  * watch **cancelling** action (can be defined as an action types array or via a function)
  * on cancelling action call AbortController abort() which leads cancelling all active **fetch** requests
  * fire correspond redux action (<ACTION_TYPE>_CANCEL) with error definition
* provides an **interceptors** for request/response processing
  * onRequest 
    * it's possible to modify the Request before call
    * for example, to add some auth headers
  * onSuccess
    * it's possible to provide some common response data processing if required
    * it's possible to fire a **redux** action if required
  * onError 
    * it's possible to fire a **redux** action if required
  * onCancel
    * it's possible to fire a **redux** action if required

The second part of **redux-fetch-requests** is a **reducer** helper which allows to get rid of plumber code for API requests processing in reducers.

The **redux-fetch-request** **requestsReducer** helper:
* process defined <ACTION_TYPE> as well as correspond success, error and cancel actions
* initialize default state with object like {data,erro,pending}
* keeps the **pending** field in accordance with request/(success|error|cancel) counter
* allows to work with arrays
* allows to define default data object via getDefaultData option
* allows to define result data processing via getData option
* allows to define error data processing via getError option
* allows to define action(s) to reset store to initial state (this action can be the same as Request)

## Sample usage

```
```

## License
MIT
