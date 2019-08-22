import {Injectable} from '@angular/core';
import {filter,}    from 'rxjs/operators';
import {NgRedux}    from '@angular-redux/store';
import * as _       from 'lodash';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReduxService {
  constructor(protected ngRedux: NgRedux<any>) {
  }

  ngOnInit() {
  }

  getState(path) {
    return _.get(this.ngRedux.getState(), path);
  }

  select<Type = any>(storeIndex): Observable<Type> {
    if (!Array.isArray(storeIndex)) {
      storeIndex = storeIndex._stack;
    }
    let previousVal = null;
    return this.ngRedux.select<Type>(storeIndex).pipe(filter((newVal) => {
      let comparison = !_.isEqual(newVal, previousVal);
      previousVal = _.cloneDeep(newVal);
      return comparison;
    }));
  }
}
