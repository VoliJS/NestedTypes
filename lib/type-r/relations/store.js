import * as tslib_1 from "tslib";
import { Record } from '../record';
import { Transactional } from '../transactions';
var _store = null;
var Store = (function (_super) {
    tslib_1.__extends(Store, _super);
    function Store() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Store.prototype.getStore = function () { return this; };
    Store.prototype.get = function (name) {
        var local = this[name];
        if (local || this === this._defaultStore)
            return local;
        return this._owner ? this._owner.get(name) : this._defaultStore.get(name);
    };
    Object.defineProperty(Store, "global", {
        get: function () { return _store; },
        set: function (store) {
            if (_store) {
                _store.dispose();
            }
            Transactional.prototype._defaultStore = _store = store;
        },
        enumerable: true,
        configurable: true
    });
    return Store;
}(Record));
export { Store };
Store.global = new Store();
//# sourceMappingURL=store.js.map