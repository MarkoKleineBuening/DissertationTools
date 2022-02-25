"use strict";

var dependencies = ['underscore',
                    'utils',
                    './Step',
                    './Mixins',
                    './TraceElement',
                    '../xmltrace/XMLTraceFile']

define(dependencies, function(_, utils, StepPkg, MixinsPkg,
                              TraceElementPkg, XMLTraceFile) {
    var Step = StepPkg.Step;
    var TraceElement = TraceElementPkg.TraceElement;
    var ExpandableMixin = MixinsPkg.ExpandableMixin;
    var ScrollTargetMixin = MixinsPkg.ScrollTargetMixin;
    
    var FunctionExecution = function() {
        function createFunctionExecutionDiv() {
            var root = $("<div>");
            var headerArea = $("<div>");
            var childArea = $("<div>");
            var footerArea = $("<div>");

            var expanderArea = $("<span>");
            var headerTextArea = $("<span>");

            var childAreaLayout = $("<div>");

            var originStepArea = $("<div>");

            root.append(originStepArea);
            root.append(headerArea);
            root.append(childAreaLayout);
            childAreaLayout.append(childArea);
            childAreaLayout.append(footerArea);
            headerArea.append(expanderArea);
            headerArea.append(headerTextArea);

            return {
                root: root,
                headerArea: headerArea,
                childArea: childArea,
                expandableArea: childAreaLayout,
                footerArea: footerArea,
                expanderArea: expanderArea,
                headerTextArea: headerTextArea,
                originStepArea: originStepArea
            };
        }

        function createExpander(onClickFn, clickableElem) {
            var expander = $("<span>");
            expander.addClass("glyphicon");
            expander.addClass("glyphicon-play");
            expander.addClass("twExpandButton");
            clickableElem.click(onClickFn);

            return {
                domElem: expander,
                setExpanded: function(expandedp) {
                    if (expandedp) {
                        expander.removeClass("glyphicon-triangle-right");
                        expander.addClass("glyphicon-triangle-bottom");
                    }
                    else {
                        expander.removeClass("glyphicon-triangle-bottom");
                        expander.addClass("glyphicon-triangle-right");
                    }
                }
            }
        }
        
        function FunctionExecution(parent, traceElem) {
            Step.call(this, parent, traceElem);
            
            utils.defConstant(this, "_domElements", createFunctionExecutionDiv());
            utils.defConstant(this, "_expander", createExpander(_.bind(function() {
                this.toggleExpanded();
            }, this), this._domElements.headerArea));
        }

        FunctionExecution.prototype = Object.create(Step.prototype);
        FunctionExecution.prototype.constructor = Step;
        FunctionExecution.prototype.parent = Step.prototype;
        _.extend(FunctionExecution.prototype, ExpandableMixin);

        FunctionExecution.prototype.getDOMElement = function() {
            return this._domElements.root;
        };

        FunctionExecution.prototype.getScrollTarget = function() {
            return { header: this._domElements.headerArea,
                     footer: this._domElements.footerArea};
        };

        FunctionExecution.prototype.getExecutedFuncName = function() {
            return this._traceElem.getLabel();
        };


        function createArgumentDisplay(fcArguments) {
            var result = $("<div>");
            result.append("Argument assignments:");

            _.each(fcArguments, function(x) {
                result.append($("<br>"));
                result.append(x.name);
                result.append(" &#x2190; ");
                result.append(x.value);
            });

            result.addClass("twNonNestedStep");

            return result;
        };
        
        FunctionExecution.prototype.render = function() {
            FunctionExecution.prototype.parent.render.call(this);
            if (this._traceElem.typeName != "FunctionExecution") {
                throw "FunctionExecution cannot render a " + this._traceElem.typeName;
            }

            var argumentList = this._traceElem.getArgumentList();
            
            if (argumentList.length > 0) {
                var argumentDisplay = createArgumentDisplay(argumentList);
                this._domElements.childArea.append(argumentDisplay);
            }

            this.discoverChildren();
            _.each(this.getChildren(), _.bind(function(child) {   
                child.render();
                var childDOMElement = child.getDOMElement();
                this._domElements.childArea.append(childDOMElement);
            }, this));

            var funcName = this.getExecutedFuncName();

            this._domElements.headerTextArea.text("Function execution: " + funcName);

            var stackTrace = this.getStackTrace();
            this._domElements.footerArea.append("End of execution: " + funcName
                                                + " (stack level " + stackTrace.length
                                                + ")");
            if (this.getParent() !== TraceElement.ROOT) {
                var parentLabel = this.getParent().getExecutedFuncName();
                
                this._domElements.footerArea.append($("<br>"));
                this._domElements.footerArea.append("Returning to execution of function "
                                                    + parentLabel);
            }
            
            this._domElements.expanderArea.append(this._expander.domElem);
            this._domElements.headerArea.addClass("twTraceItem");
            this._domElements.headerArea.addClass("twEnterFunctionCheckpoint");
            this._domElements.footerArea.addClass("twTraceItem");
            this._domElements.footerArea.addClass("twLeaveFunctionCheckpoint");

            if (this.getLabel() !== undefined) {
                var sourceLine = this.createSourceLineElement(this.getLabel());
                this._domElements.originStepArea.append(sourceLine);
                this._domElements.originStepArea.append($("<br>"));
                this._domElements.originStepArea.append("Calling function ");
                this._domElements.originStepArea.append(funcName);
                this._domElements.originStepArea.addClass("twNonNestedStep");
            }

            this.setExpanded(false);
        };

        FunctionExecution.prototype.discoverChildren = function() {
            var stepPaths = this._traceElem.getStepPaths();
            var xmlDoc = this._traceElem.getXMLDocument();
            for (var idx in stepPaths) {
                var childTraceItem = XMLTraceFile.createEntity(xmlDoc, stepPaths[idx]);
                var child = this.getRenderer()(this, childTraceItem);
                this._addChild(child);
            }
        };

        FunctionExecution.prototype._getExpandableArea = function() {
            return this._domElements.expandableArea;
        };

        FunctionExecution.prototype._getExpanderElement = function() {
            return this._expander;
        };

        FunctionExecution.prototype._onChangedExpansionState = function(expansionState) {
        };

        FunctionExecution.prototype.isHidden = function() {
            return !this.isExpanded();
        };

        FunctionExecution.prototype.getStackTrace = function() {
            if (this.getParent() === TraceElement.ROOT) {
                return [this];
            }
            else {
                var stackTrace = this.getParent().getStackTrace();
                stackTrace.push(this);
                return stackTrace;
            }
        };

        FunctionExecution.prototype.getShortLabel = function() {
            return this.getLabel();
        };

        FunctionExecution.prototype.getSelectableElement = function() {
            return this._domElements.originStepArea;
        };

        return FunctionExecution;
    }();

    return {
        FunctionExecution: FunctionExecution
    };
});
