"use strict";

var dependencies = [
    'underscore',
    'utils',
    'messaging/EventBus',
    'tracewidget/xmltrace/XMLData',
    'tracewidget/xmltrace/XMLTraceFile',
    'tracewidget/renderers/public',
    'js/traces/fileview/FileView.js', // oldTODO this is a bug.
    './ToplevelWindow',
    './Toolbar',
    './Stacktrace'
];

define(dependencies, function(_, utils, EventBusPkg, XMLData, XMLTraceFile,
                              RenderersPkg, FileViewPkg, ToplevelWindowPkg,
                              ToolbarPkg, StacktracePkg) {

    var Toolbar = ToolbarPkg.Toolbar;

    var TraceWidget = function() {

        function getRootTraceItem(xmlData) {
            var rootPath = "/Trace/FunctionExecution[1]";
            return XMLTraceFile.createEntity(xmlData, rootPath);
        };
        
        function createRootRenderNode(traceItem) {
            var toplevelElement = RenderersPkg.createRenderNode(traceItem);
            toplevelElement.render();
            //toplevelElement.setExpanded(true);
            return toplevelElement;
        };

        function createScrollContext(domElem, rootRenderNode) {
            return new RenderersPkg.ScrollContext(domElem, rootRenderNode);
        };

        function expandAndGoto(renderingNode, scrollContext) {
            renderingNode.getParent().expandAllTowardsTop();
            scrollContext.scrollTo(renderingNode);
            renderingNode.selected();
        };

        function createMainMenuHandler(scrollContext, rootRenderNode, eventBus) {
            // Keep track of the current selection for GotoCurrentSelection.
            var currentTraceSelection = undefined;
            eventBus.subscribe(eventBus.topics.selectedStep, function(x) {
                currentTraceSelection = x.stepRenderNode;
            });
            
            var subHandlers = {
                GotoFailedAssertion: function() {
                    var registry = rootRenderNode.getRegistry();
                    for (var x in registry.failedAssertions) {
                        expandAndGoto(registry.failedAssertions[x], scrollContext);
                        return;
                    }
                },

                GotoCurrentSelection: function() {
                    if (currentTraceSelection) {
                        expandAndGoto(currentTraceSelection, scrollContext);
                    }
                }
            };
            
            return function(eventId) {
                if (subHandlers.hasOwnProperty(eventId)) {
                    subHandlers[eventId]();
                }
            };
        };

        function createTitle(traceID) {
            var result = $("<span>");
            result.addClass("twTopLevelNavCaptionBold");
            result.append("Error Trace for Check ");
            result.append("" + traceID);
            return result;
        };
        
        function TraceWidget(traceID, filename, sourceFiles) {
            utils.defConstant(this, "_filename", filename);
            utils.defConstant(this, "_allSourceFiles", sourceFiles);
            utils.defConstant(this, "_traceID", traceID);
        };

        TraceWidget.prototype.create = function(onCreatedFn) {
            XMLData.loadXMLFile(this._filename, _.bind(function(xmlData) {
                utils.defConstant(this, "_xmlData", xmlData);
                this.setupTrace();
                this.setupFileView();
                this.setupToolbar();
                onCreatedFn(this);
            }, this));
        };

        TraceWidget.prototype.setupTrace = function(){
            var rootTraceItem = getRootTraceItem(this._xmlData);
            var rootRenderNode = createRootRenderNode(rootTraceItem);

            var wndConfig = {
                isFileViewEnabled: true
            };

            var eventBus = new EventBusPkg.EventBus(["selectedStep", "globalMenu"]);
            rootRenderNode.setEventBus(eventBus);
            
            var toplevelWindow = new ToplevelWindowPkg.ToplevelWindow(wndConfig, eventBus);
            var scrollContext = createScrollContext(toplevelWindow.getBodyScrollArea(),
                                                    rootRenderNode);
            
            var createStackTrace = StacktracePkg.createStackTrace;
            var stackTraceDOMElem = createStackTrace(scrollContext,
                                                     this._allSourceFiles);
            toplevelWindow.getStackTraceArea().append(stackTraceDOMElem);
            toplevelWindow.getBodyArea().append(rootRenderNode.getDOMElement());


            eventBus.subscribe(eventBus.topics.globalMenu,
                               createMainMenuHandler(scrollContext,
                                                     rootRenderNode,
                                                     eventBus));
            
            toplevelWindow.setTitle(createTitle(this._traceID));

            utils.defConstant(this, "_window", toplevelWindow);
            utils.defConstant(this, "_rootRenderingNode", rootRenderNode);
            utils.defConstant(this, "_eventBus", eventBus);
        };

        function getPathsInTrace(rootRenderingNode) {
            var result = {};
            if (rootRenderingNode.hasChildren()) {
                _.each(rootRenderingNode.getChildren(), function(child) {
                    if (child.getFileAndLineNumber) {
                        var fileInfo = child.getFileAndLineNumber();
                        result[fileInfo.filename] = true;
                    }
                    _.extend(result, getPathsInTrace(child));
                });
            }
            return result;
        };

        function getRelevantFiles(sourceFiles, rootRenderingNode) {
            var relevantPaths = getPathsInTrace(rootRenderingNode);

            var relevantFiles = _.filter(sourceFiles, function(file) {
                return relevantPaths[file.path] == true;
            });
            
            return relevantFiles;
        };

        TraceWidget.prototype.setupFileView = function() {
            var fileView = new FileViewPkg.FileView();
            this._window.getFileViewArea().append(fileView.getDOMElement());

            utils.defConstant(this, "_sourceFiles",
                              getRelevantFiles(this._allSourceFiles,
                                               this._rootRenderingNode));
            
            _.each(this._sourceFiles, function(file) {
                fileView.addFile(file);
            });

            var currentTraceSelection = undefined;
            this._eventBus.subscribe(this._eventBus.topics.selectedStep, function(x) {
                if (currentTraceSelection) {
                    currentTraceSelection.setHighlighted(false);
                }
                x.stepRenderNode.setHighlighted(true);
                currentTraceSelection = x.stepRenderNode;

                var highlightStyle = FileViewPkg.HighlightStyles.regular;
                if (currentTraceSelection.isFailureStep()) { 
                    highlightStyle = FileViewPkg.HighlightStyles.failure;
                }
                
                fileView.clearCurrentHighlight();
                var realLineCount = (x.linecount > 0) ? x.linecount : 1;
                fileView.highlightAndScroll(x.filename, x.linenumber, realLineCount,
                                            highlightStyle);
            });

            fileView.setFileVisible(this._sourceFiles[0].path);

            utils.defConstant(this, "_fileView", fileView);
        };

        TraceWidget.prototype.setupToolbar = function() {
            utils.defConstant(this, "_toolbar", new Toolbar(this._eventBus,
                                                            this._eventBus.topics.globalMenu));
            this._window.getToolbarArea().append(this._toolbar.getDOMElement());
            //this._toolbar.addDefaultButton("foo1", "button1");
            //this._toolbar.addDefaultButton("foo2", "button2");
        };

        TraceWidget.prototype.getDOMElement = function() {
            return this._window.getDOMElement();
        };

        TraceWidget.prototype._selectStep = function(renderingNode) {
            if (!renderingNode.getParent().isRoot()) {
                renderingNode.getParent().expandAllTowardsTop();
            }
            
            scrollContext.scrollTo(renderingNode);
            renderingNode.selected();
        }

        TraceWidget.prototype.firstTimeVisible = function() {
            this._eventBus.publish(this._eventBus.topics.globalMenu,
                                   "GotoFailedAssertion");
        };

        return TraceWidget;
    }();


    

    
    /** 
     * Creates a trace widget object using the given trace and source
     * files, passing the widget to the given callback function.
     *
     * @param {string} traceID     The trace's error check ID.
     * 
     * @param {string} filename    The path of the trace's XML file.
     *
     * @param {Object} sourceFiles An array of source code objects. A
     *   source code object is a JS Object having the following
     *   fields: 
     *     path: The path to the source code file.  
     *     shortName: A short name of the file, used for navigation.
     *     contents: An array containing the lines of the source code file.
     *
     * @param {Function} A single-argument callback function receiving the
     *   newly created TraceWidget object.
     *
     * @returns Nothing.
     * 
     */
    function createTraceWidget(traceID, filename, sourceFiles, recvFn) {
        var traceWidget = new TraceWidget(traceID, filename, sourceFiles);
        traceWidget.create(recvFn);
    };

    return {
        createTraceWidget: createTraceWidget
    };
});
