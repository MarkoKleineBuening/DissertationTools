var dependencies = ['underscore',
                    'utils',
                    './Step']

define(dependencies, function(_, utils, StepPkg) {
    var Step = StepPkg.Step;
    
    var Assignment = function() {
        
        function Assignment(parent, traceElem) {
            Step.call(this, parent, traceElem);
            utils.defConstant(this, "_rootElem", $("<div>"));
        };

        Assignment.prototype = Object.create(Step.prototype);
        Assignment.prototype.constructor = Step;
        Assignment.prototype.parent = Step.prototype;

        Assignment.prototype.getDOMElement = function() {
            return this._rootElem;
        };

        Assignment.prototype.render = function() {
            Assignment.prototype.parent.render.call(this);
            this._rootElem.addClass("twNonNestedStep");

            var sourceLine = this.createSourceLineElement(this.getLabel());
            this._rootElem.append(sourceLine);
            this._rootElem.append($("<br>"));
            this._rootElem.append(this._traceElem.getVariable());
            this._rootElem.append(" &#x2190; ");
            this._rootElem.append(this._traceElem.getValue());
        };

        return Assignment;
    }();

    return {
        Assignment: Assignment
    }
});
