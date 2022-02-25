var dependencies = ["underscore", "utils"];

define(dependencies, function(_, utils) {
    function ObserverManager() {
        utils.defConstant(this, "_observers", []);
    };

    ObserverManager.prototype = new Object();

    ObserverManager.prototype.addObserver = function(observer) {
        this._observers.push(observer);
    };

    ObserverManager.prototype.callObservers = function() {
        var args = [];
        _.each(arguments, function(arg) {
            args.push(arg);
        });

        _.each(this._observers, function(observer) {
            observer.apply(this, args);
        });
    };

    return {
        ObserverManager: ObserverManager,
    };
});
