var dependencies = ['underscore',
                    'utils',
                    './TraceElement',
                    './Mixins']

define(dependencies, function(_, utils, TraceElementPkg, MixinsPkg) {
    var TraceElement = TraceElementPkg.TraceElement;
    var ScrollTargetMixin = MixinsPkg.ScrollTargetMixin;

    var Step = function() {
        function Step(parent, traceElem) {
            Step.prototype.constructor.call(this, parent, traceElem);
            this._isHighlightable = false;
        }

        Step.prototype = Object.create(TraceElement.prototype);
        Step.prototype.constructor = TraceElement;
        Step.prototype.parent = TraceElement.prototype;
        _.extend(Step.prototype, ScrollTargetMixin);

        Step.prototype.render = function() {
            var domElem = this.getSelectableElement();
            if (this.isSelectable()) {
                domElem.addClass("twSelectableStep");
                domElem.click(_.bind(function() {this.selected();
                                                 return false;},
                                     this));
            }
        };

        Step.prototype.getSelectableElement = function() {
            return this.getDOMElement();
        };

        Step.prototype.selected = function() {
            var eventBus = this.getEventBus();
            var fileNLine = this.getFileAndLineNumber();

            eventBus.publish(eventBus.topics.selectedStep,
                             _.extend(fileNLine, {
                                 stepRenderNode: this
                             }, this));
        };

        Step.prototype.isSelectable = function() {
            if (!this._stepTraceElem) {
                return false;
            }

            return (this._stepTraceElem.hasLineNumber() &&
                    this._stepTraceElem.hasFilename());
        };

        Step.prototype.getFileAndLineNumber = function() {
            if (!this._stepTraceElem) {
                throw "You need to ensure that the step trace element" +
                    " is set before calling this method.";
            }
            return {
                filename: this._stepTraceElem.getFilename(),
                linenumber: this._stepTraceElem.getLineNumber(),
                linecount: this._stepTraceElem.getLabelSize()
            };
        };

        Step.prototype.setHighlighted = function(highlightedp) {
            if (this.isSelectable()) {
                var highlightArea = this.getSelectableElement();
                if (highlightedp) {
                    highlightArea.addClass("twSelectedStep");
                }
                else {
                    highlightArea.removeClass("twSelectedStep");
                }
            }
        };

        Step.prototype.isFailureStep = function() {
            return false;
        };

        Step.prototype.createSourceLineElement = function(sourceLines) {
            var result = $("<span>");
            result.addClass("twSourceCodeLine");
            if (sourceLines instanceof Array) {
                result.append(sourceLines.join("<br>"));
            }
            else {
                result.append("--");
            }

            return result;
        };

        Step.prototype.setStepTraceElement = function(stepTraceElement) {
            this._stepTraceElem = stepTraceElement;
        };

        return Step;
    }();

    return {
        Step: Step
    };
});
