"use strict";

var dependencies = ['underscore', 'utils', './XMLData'];

define(dependencies, function(_, utils, XML) {

    var isObj = utils.isObj;
    var assert = utils.assert;

    function defaultXMLTraceFileConstructor(target, args) {
        var xmlDocument = args.xmlDocument;
        var xmlTagName = args.xmlTagName;
        var typeName = args.typeName;
        var path = args.path;

        assert(isObj(xmlDocument), "Invalid xmlDocument");
        assert(isObj(path), "Invalid path");
        
        utils.defConstant(target, "_xmlDocument", xmlDocument);
        utils.defConstant(target, "_path", path);
        var description = XML.retrieve(xmlDocument, path, xmlTagName);
        assert(isObj(description), "Could not read XML data.");
        utils.defConstant(target, "_asXML", description);
        
        utils.defConstant(target, "typeName", typeName);
    }

    var FunctionExecution = function() {
        function FunctionExecution(xmlDocument, path) {
            defaultXMLTraceFileConstructor(this, {
                xmlDocument: xmlDocument,
                path: path,
                xmlTagName: "FunctionExecution",
                typeName: "FunctionExecution"
            });
        };

        FunctionExecution.prototype.getLabel = function() {
            return this._asXML.getAttribute("functionName");
        };

        FunctionExecution.prototype.getArgumentListPath = function() {
            return this._asXML.getChild("ArgumentList").getPath();
        };

        FunctionExecution.prototype.getStepPaths = function() {
            if (!this._asXML.hasChild("StepList")) {
                return [];
            }
            else {
                var stepList = this._asXML.getChild("StepList");
                return _.map(stepList.getArrayValues(),
                             function(xmlElement) {
                                 return xmlElement.getPath();
                             });
            }
        };

        FunctionExecution.prototype.getPath = function() {
            return this._asXML.getPath();
        };

        FunctionExecution.prototype.getXMLDocument = function() {
            return this._xmlDocument;
        };

        FunctionExecution.prototype.getArgumentList = function() {
            var args = this._asXML.getChild("ArgumentList");
            var argsArr = args.getArrayValues();
            var argsWithJunk = _.map(argsArr, function(x) {
                return {
                    name : x.getAttribute("argumentName"),
                    type: x.getAttribute("type"),
                    value: x.getElement().textContent.trim()
                }
            });

            return _.filter(argsWithJunk, function(x) {
                return x.value != "<unknown>";
            });
        };

        return FunctionExecution;
    }();

    var DeclaredFunctionCall = function() {
        function DeclaredFunctionCall(xmlDocument, path) {
            defaultXMLTraceFileConstructor(this, {
                xmlDocument: xmlDocument,
                path: path,
                xmlTagName: "DeclaredFunctionCall",
                typeName: "DeclaredFunctionCall"
            });
        };

        DeclaredFunctionCall.prototype.getText = function() {
            var result = this._asXML.getAttribute("name");
            assert (result !== undefined);
            return result;
        };

        return DeclaredFunctionCall;
    }();

    var Assignment = function() {
        function Assignment(xmlDocument, path) {
            defaultXMLTraceFileConstructor(this, {
                xmlDocument: xmlDocument,
                path: path,
                xmlTagName: "Assignment",
                typeName: "Assignment"
            });
        };

        Assignment.prototype.getVariable = function() {
            return this._asXML.getAttribute("assigneeName");
        };

        Assignment.prototype.getVariableType = function() {
            return this._asXML.getAttribute("type");
        };

        Assignment.prototype.getValue = function() {
            return this._asXML.getElement().textContent;
        };

        return Assignment;
    }();

    var FailedAssertion = function() {
        function FailedAssertion(xmlDocument, path) {
            defaultXMLTraceFileConstructor(this, {
                xmlDocument: xmlDocument,
                path: path,
                xmlTagName: "Assertion",
                typeName: "Assertion"
            });
        };

        FailedAssertion.prototype.getRawText = function() {
            return "<b>Assertion failed</b>";
            // See issue QPR-21
        };

        FailedAssertion.prototype.hasChild = function() {
            var childTags = this._asXML.getChildTags();
            return (childTags.length == 1);
        };

        FailedAssertion.prototype.getChildRaw = function() {
            var childTags = this._asXML.getChildTags();
            if (childTags.length != 1) {
                console.log("About to throw in the context of: ");
                console.log(this);
                console.log("Child tags:");
                console.log(childTags);
                throw "FailedAssertion " + this._path + " does not have exactly one child.";
            }
            return this._asXML.getChild(childTags[0]);
        };

        return FailedAssertion;
    }();

    var Step = function() {
        function Step(xmlDocument, path) {
            defaultXMLTraceFileConstructor(this, {
                xmlDocument: xmlDocument,
                path: path,
                xmlTagName: "Step",
                typeName: "Step"
            });
        };

        Step.prototype.getLabel = function() {
            if(this._asXML.hasChild("SourceLineList")) {
                var lines = this._asXML.getChild("SourceLineList");
                return _.map(lines.getArrayValues(),
                             function(lineXML) {
                                 return lineXML.getElement().textContent.trim();
                             });
            }
            else {
                return undefined;
            }
        };

        Step.prototype.getLabelSize = function() {
            if(!this._asXML.hasChild("SourceLineList")) {
                return 0;
            }
            var sll = this._asXML.getChild("SourceLineList");
            return sll.getArrayValues().length;
        };

        Step.prototype.hasChild = function() {
            return this._asXML.hasChild("FunctionExecution");
        };

        Step.prototype.getChildPath = function() {
            assert(this._asXML.hasChild("Call"),
                   "This node does not have children.");
            return this._asXML.getChild("Call").getPath();
        };

        Step.prototype.getInLabelChildPath = function() {
            var tags = ["DeclaredFunctionCall", "Assignment",
                        "Assertion", "ControlFlow",
                        "Call"];
            for (var tag in tags) {
                if (this._asXML.hasChild(tags[tag])) {
                    return this._asXML.getChild(tags[tag]).getPath();
                }
            }
            return undefined;
        };

        Step.prototype.getInLabelChild = function() {
            var inLabelChildPath = this.getInLabelChildPath();
            if (inLabelChildPath !== undefined) {
                return createEntity(this._xmlDocument, inLabelChildPath);
            }
            else {
                return undefined;
            }
        };

        Step.prototype.getPath = function() {
            return this._asXML.getPath();
        };

        Step.prototype.getXMLDocument = function() {
            return this._xmlDocument;
        };

        Step.prototype.getLineNumber = function() {
            return this._asXML.getAttribute("line");
        };

        Step.prototype.hasLineNumber = function() {
            return this._asXML.hasAttribute("line");
        };

        Step.prototype.getFilename = function() {
            return this._asXML.getAttribute("file");
        };

        Step.prototype.hasFilename = function() {
            return this._asXML.hasAttribute("file");
        };

        return Step;
    }();

    var Call = function() {
        function Call(xmlDocument, path) {
            defaultXMLTraceFileConstructor(this, {
                xmlDocument: xmlDocument,
                path: path,
                xmlTagName: "Call",
                typeName: "Call"
            });
        };

        Call.prototype.getActualCallPath = function() {
            assert(this._asXML.hasChild("FunctionExecution"),
                   "Currently, only FunctionExecution elements can be" +
                   "rendered as Call children.");
            return this._asXML.getChild("FunctionExecution").getPath();
        };

        Call.prototype.getActualCall = function() {
            var actualCallPath = this.getActualCallPath();
            return createEntity(this._xmlDocument, actualCallPath);
        };

        return Call;
    }();


    function createEntity(xmlDocument, path) {
        var metaClasses = {
            "Step" : Step,
            "FunctionExecution" : FunctionExecution,
            "DeclaredFunctionCall" : DeclaredFunctionCall,
            "Assignment" : Assignment,
            "Assertion" : FailedAssertion,
            "Call" : Call
        };

        var xmlElem = XML.retrieve(xmlDocument, path);
        assert(isObj(xmlElem), "Could not retrieve " + path);
        var tagName = xmlElem.getTagName();

        assert(metaClasses.hasOwnProperty(tagName),
               "Don't know how to create a " + tagName
               + " retrieved from " + path);

        return new metaClasses[tagName](xmlDocument, path);
    }


    return {
        FunctionExecution : FunctionExecution,
        Step : Step,
        createEntity : createEntity
    };
});
