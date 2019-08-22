/* ASYNCHRONOUS ACTIONS */
export const asyncInitialState = {
  data: null,
  loading: false,
  error: null
};

export const asyncRequestAction = function (state, action) {
  return {
    // ...state, //spread operator - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    loading: true
  };
};

export const asyncSuccessAction = function (state, action) {
  return {
    // ...state, //spread operator - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    data: action.data,
    //ES2015 Computed property names : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
    loading: false

  };
};

function failureAction(state, action, async) {
  let failState = {
    error: action.error
  };
  if (async) {
    failState['loading'] = false;
  }
  return failState;
}

export const asyncFailureAction = (state, action) => {
  return failureAction(state, action, true);
};

/*
  NON-ASYNCHRONOUS ACTIONS
  - Using the term nonAsync because sync looks too much like async and is too easy to mess up
*/
export const nonAsyncRequestAction = function (state, action) {
  return {data: action.data};
};

export const nonAsyncFailureAction = (state, action) => {
  return failureAction(state, action, false);
};

export const nonAsyncInitialState = {
  data: null,
  error: null
};
