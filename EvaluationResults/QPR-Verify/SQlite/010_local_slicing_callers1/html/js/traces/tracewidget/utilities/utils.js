var dependencies = [];

define(dependencies, function() {
    var utils = {};

    utils.setVisible = function(query, visiblep) {
        if (visiblep) {
            query.show();
        }
        else {
            query.hide();
        }
    };

    utils.defConstant = function(obj, field, value) {
        Object.defineProperty(obj, field, {
            value: value,
            writable: false,
            enumerable: false,
            configurable: false
        });
    };

    utils.copyPropsIfUndefInTarget = function(target, source) {
        var result;
        if (typeof target === "undefined") {
            result = {};
        }
        else {
            result = _.extendOwn({}, target);
        }

        _.each(source, function(value, property) {
            if (typeof result[property] === "undefined") {
                result[property] = value;
            }
        });

        return result;
    };

    utils.withCorrespondingValues = function(source, target, fusionFunc) {
        _.each(_.keys(source), function(key) {
            if (target.hasOwnProperty(key)) {
                fusionFunc(source[key], target[key]);
            }
        });
    };

    utils.callIfDefined = function(fn, returnValIfUndef) {
        if (typeof fn !== "undefined") {
            var args = Array.slice(arguments, 2);
            return fn.apply(this, args);
        }
    };

    utils.synthesizeScrollEvent = function() {
        setTimeout(function() {
            $(window).scroll();
            $(window).resize();
        }, 1000);
    };

    utils.isInView = function(target, container) {
        var containerTop = container.offset().top;
        var containerBottom = containerTop + container.height();
        var targetTop = target.offset().top;
        var targetBottom = targetTop + target.height();

        if (targetTop == targetBottom) {
            //throw new Error("Trying to scroll to a non-displayed element");
            console.log("WARNING: Trying to scroll to a non-displayed element");
            return true;
        }
        else {
            return targetBottom <= containerBottom && targetTop >= containerTop;
        }
    };

    utils.scrollTo = function(container, target, offset) {
        if (!utils.isInView(target, container)) {
            container.animate({
                scrollTop: container.scrollTop() + target.offset().top + offset
            }, 100);
        }
    }

    utils.assertNumber = function(n, name) {
        if (typeof n !== "number" || n == NaN) {
            throw new Error("Invalid value for " + name + ": " + n);
        }
    };

    utils.assertInstanceof = function(o, metaclass) {
        if (!(o instanceof metaclass)) {
            throw new Error("o is not of class " + metaclass);
        }
    }

    utils.isObj = function(thing) {
        return thing !== undefined && thing !== null;
    };
    
    utils.assert = function(cond, msg) {
        if (!cond) {
            throw msg;
        }
    };

    utils.morph = function (morphed, metaObj) {
        morphed.prototype = metaObj.prototype;
        morphed.__proto__ = metaObj.prototype;
        morphed.constructor = metaObj.constructor;
        return _.bind(metaObj, morphed); // new constructor
    };

    return utils;
});
