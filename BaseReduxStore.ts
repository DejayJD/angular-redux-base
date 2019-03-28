import * as _ from 'lodash';
import {NgRedux} from '@angular-redux/store';
import {
  asyncFailureAction,
  asyncInitialState,
  asyncRequestAction,
  asyncSuccessAction,
  nonAsyncFailureAction,
  nonAsyncInitialState,
  nonAsyncRequestAction
} from './action-types';
import {Router} from '@angular/router';

export interface ReduxActionType {
  request: string;
  success: string;
  failure: string;
}

export class ReduxAction {
  constructor(action, actionTypes, reducer) {
    this.action = action;
    this.actionTypes = actionTypes;
    this.reducer = reducer;
  }

  action: any;
  actionTypes: ReduxActionType;
  reducer: any;
}

export class ReduxParameters {
  /*  storeIndex will be where the reducer will store your desired data (loading/error/data)
      If null, will just go to global scope
      Example Values:
        {storeIndex: 'currentDistributor'}
        {storeIndex: null} <-- in this case, you can just omit storeIndex entirely
  */
  storeIndex?: string;
  /*  actionData will be whatever action function you are desiring
      Possible values: function returning a promise, normal function, or just data
      Example Values:
        {actionData: axios.get('/url')}
        {actionData: (data)=>{return {someData:data}}
        {actionData: someVariableData}
  */
  actionData: any;
  /*
    routeOnFinish will automatically route after the action has finished (will be _SUCCESS for async)
    routeOnError will automatically route if the action has failed (any time it reaches _FAILURE)
    Example Values
      {routeOnFinish: '/home'}
      {routeOnError: '/error-page'}
   */
  routeOnFinish: string;
  routeOnError: string;


  successParam?: string;

}

export abstract class BaseReduxStore {
  constructor(protected ngRedux: NgRedux<any>, protected router: Router) {
  }

  reduxBuilder(actionName: string,
               actionFunction,
               async: boolean = false,
               successReducer: Function = null,
               requestReducer: Function = null,
               failureReducer: Function = null): ReduxAction {
    const actionRequest = actionName + (async ? '_REQUEST' : '');
    const actionSuccess = actionName + '_SUCCESS';
    const actionFailure = actionName + '_FAILURE';
    const initialState = async ? asyncInitialState : nonAsyncInitialState;
    const reducer = (state = initialState, action) => {
      //Init failure Action before the switch statement, so that we can use it if either our Request/Success reducers fail
      let failureAction: Function = async ? asyncFailureAction : nonAsyncFailureAction;
      if (!_.isNil(failureReducer)) {
        failureAction = failureReducer;
      }
      try {
        switch (action.type) {
          case actionRequest:
            let requestAction: Function = async ? asyncRequestAction : nonAsyncRequestAction;
            if (!_.isNil(requestReducer)) {
              requestAction = requestReducer;
            }
            //I added this case, because I kept thinking, I want to overload my reducer action when its finished "on success"
            //However there is no success state for non-async actions so I added this for when you accidentally used a success reducer
            if (!_.isNil(successReducer) && _.isNil(requestReducer) && !async) {
              requestAction = successReducer;
            }
            return requestAction(state, action);

          case actionSuccess: //Success action only applies to ASYNC actions
            let successAction: Function = asyncSuccessAction;
            if (!_.isNil(successReducer)) {
              successAction = successReducer;
            }
            return successAction(state, action);

          case actionFailure:
            return failureAction(state, action);

          default:
            return state;
        }
      } catch (e) {
        console.error(`Error in Reducer ${action.type}. Data:`, {error: e, action: action});
        action.error = e.message;
        if (action.type = actionFailure) {
          //If the error is with the failure function, we just use a default error reducer instead
          failureAction = async ? asyncFailureAction : nonAsyncFailureAction;
        }
        return failureAction(state, action);
      }
    };


    // Not using arrow function, because need args binding here
    const action = function () {
      const args = arguments;
      let storeIndex;
      try {
        //First we get our action response, should be formatted like the following:
        /* { storeIndex, actionData}  */
        let actionResponse: ReduxParameters = actionFunction.apply(null, args);
        storeIndex = actionResponse.storeIndex || null; //StoreIndex is where the data will be stored
        let actionData = actionResponse.actionData;
        let routeOnFinish = actionResponse.routeOnFinish;
        let routeOnError = actionResponse.routeOnError;
        let successParam = actionResponse.successParam;
        if (!_.isNil(actionData)) {
          // If it's an async promise, then we wait for the promise before checking success/failure
          if (typeof actionData.then === 'function') { //.then is a function means a promise
            this.ngRedux.dispatch({
              type: actionRequest,
              storeIndex: storeIndex
            });
            actionData.then(data => {
                //Async request is successful
                this.ngRedux.dispatch({
                  type: actionSuccess,
                  storeIndex: storeIndex,
                  newRoute: routeOnFinish,
                  successParam:successParam,
                  data
                });
              }
            )
              //Caught async error
              .catch(error => {
                this.ngRedux.dispatch({
                  type: actionFailure,
                  storeIndex: storeIndex,
                  error
                });
              });
          } else {
            // Action returned is non-async function
            let data = actionData; //The format can either be a function or just an object
            if (typeof actionData === 'function') {
              data = actionData(); //Evaluate function if this is the case
            }
            this.ngRedux.dispatch({
              type: actionRequest,
              newRoute: routeOnFinish,
              successParam:successParam,
              storeIndex: storeIndex,
              data
            });
          }
        } else { //The data returned is null
          this.ngRedux.dispatch({
            type: actionRequest,
            newRoute: routeOnFinish,
            successParam:successParam,
            storeIndex: storeIndex,
            data: null
          });
        }
        // If its not a promise, we really dont want to see "_SUCCESS" just return the try/catch error results
      } catch (error) {
        console.log(error.message);
        this.ngRedux.dispatch({
          type: actionFailure,
          storeIndex: storeIndex,
          error: error.message
        });
      }
    }.bind(this);
    return new ReduxAction(
      action,
      {
        request: actionRequest,
        success: actionSuccess,
        failure: actionFailure
      },
      reducer);
  };

  masterReducer(state, action) {
    if (_.isNil(state)) {
      state = {};
    }
    for (let key of Object.keys(this)) {
      let prop = this[key];
      if (_.isNil(prop)) {
        continue;
      }
      if (prop instanceof ReduxAction) {
        if (Object.values(prop.actionTypes).find(type => type === action.type)) {
          let newState = prop.reducer(state, action);
          if (!_.isNil(action.storeIndex)) {
            newState = {[action.storeIndex]: newState};
          }
          if (!_.isNil(action.newRoute)) {
            this.router.navigateByUrl(action.newRoute);
          }
          return _.cloneDeep(_.merge(state, newState));
        }
      }
    }
    //All else failing we will leave state the same as before
    return state;
  }
}
