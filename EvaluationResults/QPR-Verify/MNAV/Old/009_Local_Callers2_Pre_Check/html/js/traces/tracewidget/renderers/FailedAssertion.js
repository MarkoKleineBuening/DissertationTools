var dependencies = ['underscore',
                    'utils',
                    './Step',
                    './Mixins']

define(dependencies, function(_, utils, StepPkg, MixinsPkg) {
    var Step = StepPkg.Step;
    var ScrollTargetMixin = MixinsPkg.ScrollTargetMixin;

    var FailedAssertion = function() {
        function FailedAssertion(parent, traceElem) {
            Step.call(this, parent, traceElem);
            utils.defConstant(this, "_rootElem", $("<div>"));

            var registry = this.getRegistry();
            if (!registry.failedAssertions) {
                registry.failedAssertions = {};
            }
            
            registry.failedAssertions[traceElem._path] = this;
        };

        FailedAssertion.prototype = Object.create(Step.prototype);
        FailedAssertion.prototype.constructor = Step;
        FailedAssertion.prototype.parent = Step.prototype;
        _.extend(FailedAssertion.prototype,
                 ScrollTargetMixin);

        FailedAssertion.prototype.getDOMElement = function() {
            return this._rootElem;
        };

        FailedAssertion.prototype.render = function() {
            FailedAssertion.prototype.parent.render.call(this);
            this._rootElem.addClass("twNonNestedStep");
            this._rootElem.addClass("twFailedAssertion");

            var hasFurtherInfo = this._traceElem.hasChild();
            if (hasFurtherInfo) {
                var rawSubAssertion = this._traceElem.getChildRaw();
                this._rootElem.append("Failed Assertion: "
                                      + rawSubAssertion.getTagName());
            }
            else {
                this._rootElem.append("Failed Assertion");
            }
        };

        FailedAssertion.prototype.setHighlighted = function() {
        };

        FailedAssertion.prototype.isFailureStep = function() {
            return true;
        };

        return FailedAssertion;
    }();

    return {
        FailedAssertion: FailedAssertion
    };
});
