"use strict";

var dependencies = ['underscore',
                    'utils',
                    './Step'];

define(dependencies, function(_, utils, StepPkg) {
    var Step = StepPkg.Step;

    var DeclaredFunctionCall = function() {
        function DeclaredFunctionCall(parent, traceElem) {
            DeclaredFunctionCall.prototype.constructor.call(this, parent, traceElem);
            utils.defConstant(this, "_rootElem", $("<div>"));
        };

        DeclaredFunctionCall.prototype = Object.create(Step.prototype);
        DeclaredFunctionCall.prototype.constructor = Step;
        DeclaredFunctionCall.prototype.parent = Step.prototype;

        DeclaredFunctionCall.prototype.render = function() {
            DeclaredFunctionCall.prototype.parent.render.call(this);
            this._rootElem.addClass("twNonNestedStep");
            this._rootElem.addClass("twNonNestedStep");
            var declFun = this.createSourceLineElement(this.getLabel());
            this._rootElem.append(declFun);
            this._rootElem.append($("<br>"));
            var funcname = this.getTraceElement().getText()
            this._rootElem.append("Calling intrinsic function " + funcname);
        };

        DeclaredFunctionCall.prototype.getDOMElement = function() {
            return this._rootElem;
        };
        
        return DeclaredFunctionCall;
    }();

    return {
        DeclaredFunctionCall: DeclaredFunctionCall
    };
});
