export function getOwnerEndpoint(self) {
    var collection = self.collection;
    if (collection) {
        return getOwnerEndpoint(collection);
    }
    if (self._owner) {
        var _endpoints = self._owner._endpoints;
        return _endpoints && _endpoints[self._ownerKey];
    }
}
export function createIOPromise(initialize) {
    var resolve, reject, onAbort;
    function abort(fn) {
        onAbort = fn;
    }
    var promise = new Promise(function (a_resolve, a_reject) {
        reject = a_reject;
        resolve = a_resolve;
        initialize(resolve, reject, abort);
    });
    promise.abort = function () {
        onAbort ? onAbort(resolve, reject) : reject(new Error("I/O Aborted"));
    };
    return promise;
}
export function startIO(self, promise, options, thenDo) {
    abortIO(self);
    options.ioUpdate = true;
    self._ioPromise = promise
        .then(function (resp) {
        self._ioPromise = null;
        var result = thenDo ? thenDo(resp) : resp;
        triggerAndBubble(self, 'sync', self, resp, options);
        return result;
    })
        .catch(function (err) {
        self._ioPromise = null;
        console.error(err);
        triggerAndBubble(self, 'error', self, err, options);
        throw err;
    });
    self._ioPromise.abort = promise.abort;
    return self._ioPromise;
}
export function abortIO(self) {
    if (self._ioPromise && self._ioPromise.abort) {
        self._ioPromise.abort();
        self._ioPromise = null;
    }
}
export function triggerAndBubble(eventSource) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    eventSource.trigger.apply(eventSource, args);
    var collection = eventSource.collection;
    collection && collection.trigger.apply(collection, args);
}
//# sourceMappingURL=io-tools.js.map