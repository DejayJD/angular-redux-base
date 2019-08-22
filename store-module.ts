import {combineReducers}              from 'redux';
import {Injectable}                   from '@angular/core';
import {DevToolsExtension, NgRedux}   from '@angular-redux/store';
import {AxiosDefaultConfig}           from './tools/axios-config';
import {environment}                  from '../../environments/environment';
import {NgReduxRouter, routerReducer} from '@angular-redux/router';
import {ProductStore}                 from './stores/ProductStore';
import {UserStore}                    from './stores/UserStore';
import {SupplyCartStore}              from './stores/SupplyCartStore';
import {ExportStore}                  from './stores/ExportStore';
import {ConfigStore}                  from './stores/ConfigStore';
import {TruckRuleStore}               from './stores/TruckRuleStore';
import {BatteryCartStore}             from './stores/BatteryCartStore';
import {AutoCompleteStore}            from './stores/AutoCompleteStore';
import {BatterySearchStore}           from './stores/BatterySearchStore';
import {AlertService}                 from '../shared/services/alert.service';
import {errorAlerts}                  from './tools/error-middleware';
import {OrderTemplateStore} from './stores/OrderTemplateStore';
import {AgreementStore}     from './stores/AgreementStore';
import {CommonStore}        from './stores/CommonStore';
import {Stores}             from '../shared/classes/Stores';
import {PurchaseOrderStore} from './stores/PurchaseOrderStore';
import {AddressStore}       from './stores/AddressStore';
import {PromoStore}         from './stores/PromoStore';
import {SavedOrderStore}    from './stores/SavedOrderStore';
import {LoggerService}      from '../shared/logger/logger.service';
import {logMiddleware}      from '../shared/logger/log-middleware';

@Injectable({
  providedIn: 'root'
})
export class ReduxStore {

  constructor(protected ngRedux: NgRedux<any>,
              protected ngReduxRouter: NgReduxRouter,
              protected devTools: DevToolsExtension,
              protected UserStore: UserStore,
              protected ProductStore: ProductStore,
              protected SupplyCartStore: SupplyCartStore,
              protected BatteryCartStore: BatteryCartStore,
              protected ExportStore: ExportStore,
              protected AutoCompleteStore: AutoCompleteStore,
              protected ConfigStore: ConfigStore,
              protected CommonStore: CommonStore,
              protected TruckRuleStore: TruckRuleStore,
              protected BatterySearchStore: BatterySearchStore,
              protected OrderTemplateStore: OrderTemplateStore,
              protected AgreementStore: AgreementStore,
              protected AddressStore: AddressStore,
              protected PurchaseOrderStore: PurchaseOrderStore,
              protected PromoStore: PromoStore,
              protected SavedOrderStore: SavedOrderStore,
              protected logService: LoggerService,
              protected AxiosDefaultConfig: AxiosDefaultConfig,
              protected AlertSerivice: AlertService) {
    let rootReducer = combineReducers({
      [Stores.UserStore['_name']]: UserStore.masterReducer.bind(UserStore),
      [Stores.ProductStore['_name']]: ProductStore.masterReducer.bind(ProductStore),
      [Stores.SupplyCartStore['_name']]: SupplyCartStore.masterReducer.bind(SupplyCartStore),
      [Stores.ExportStore['_name']]: ExportStore.masterReducer.bind(ExportStore),
      [Stores.BatteryCartStore['_name']]: BatteryCartStore.masterReducer.bind(BatteryCartStore),
      [Stores.AutoCompleteStore['_name']]: AutoCompleteStore.masterReducer.bind(AutoCompleteStore),
      [Stores.ConfigStore['_name']]: ConfigStore.masterReducer.bind(ConfigStore),
      [Stores.BatterySearchStore['_name']]: BatterySearchStore.masterReducer.bind(BatterySearchStore),
      [Stores.OrderTemplateStore['_name']]: OrderTemplateStore.masterReducer.bind(OrderTemplateStore),
      [Stores.TruckRuleStore['_name']]: TruckRuleStore.masterReducer.bind(TruckRuleStore),
      [Stores.CommonStore['_name']]: CommonStore.masterReducer.bind(CommonStore),
      [Stores.AgreementStore['_name']]: AgreementStore.masterReducer.bind(AgreementStore),
      [Stores.AddressStore['_name']]: AddressStore.masterReducer.bind(AddressStore),
      [Stores.PurchaseOrderStore['_name']]: PurchaseOrderStore.masterReducer.bind(PurchaseOrderStore),
      [Stores.PromoStore['_name']]: PromoStore.masterReducer.bind(PromoStore),
      [Stores.SavedOrderStore['_name']]: AgreementStore.masterReducer.bind(SavedOrderStore),

      router: routerReducer
      //Any new stores will need to be added to this list
    });

    let middleware = [logMiddleware(logService), errorAlerts(this.AlertSerivice, logService)];

    if (!environment.production) {
      //Show the redux logger only on dev - this will otherwise pollute our custom logging solution
      middleware = [...middleware];
      //Optional- uncomment this to see constant logs of redux in your console
      // middleware = [...middleware, logger];
    }

    ngRedux.configureStore(
      rootReducer, //Stores
      {}, //Default state
      middleware, //Middleware array
      devTools.isEnabled() ? [devTools.enhancer()] : [], //In-browser redux tools
    );
    if (ngReduxRouter) {
      ngReduxRouter.initialize();
    }
  }
}
