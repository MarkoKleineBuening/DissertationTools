var dependencies = ['underscore',
                    'utils',
                    'tracewidget/renderers/public'];

define(dependencies, function(_, utils, RenderersPkg) {

    var createStackTrace = function() {
        function getStackTraceTooltip(rendererNode, sourceFileDB) {
            try {
                var loc = rendererNode.getFileAndLineNumber();
                var file = sourceFileDB[loc.filename];
                return file.shortName + ":" + loc.linenumber;
            }
            catch (e) {
                return undefined;
            }
        };

        function createStackTraceSourceDB(sourceFileDB) {
            return _.reduce(sourceFileDB, function(memo, next) {
                var entry = {};
                entry[next.path] = next;
                return _.extend(memo, entry);
            }, {});
        }
        
        function createStackTrace(scrollContext, sourceFileDB) {
            var root = $("<ol>");
            root.addClass("breadcrumb");

            var currentStackTrace = undefined;

            var stackTraceSourceDB = createStackTraceSourceDB(sourceFileDB);
            
            scrollContext.addScrollListener(function() {
                var stackTop = scrollContext.getElementAtTop();
                if (stackTop != "none") {
                    while (!stackTop.getStackTrace) {
                        stackTop = stackTop.getParent();
                    }

                    if (stackTop === RenderersPkg.TraceElement.ROOT) {
                        return;
                    }
                    
                    var stackTrace = stackTop.getStackTrace();
                    
                    if (stackTrace !== currentStackTrace) {
                        root.empty();
                        for (var x in stackTrace) {
                            var stElem = stackTrace[x];
                            var child = $("<li>");
                            
                            if (x == stackTrace.length-1) {
                                child.addClass("active");
                            }

                            var tooltip = getStackTraceTooltip(stElem, stackTraceSourceDB);
                            var params = tooltip ? "data-toggle=\"tooltip\" title=\"" +
                                tooltip + "\"" : "";
                            var innerChild = $("<a href=\"#\" " + params + ">");
                            child.append(innerChild);
                            innerChild.append(""+stElem.getExecutedFuncName());
                            
                            (function(_stElem) {
                                innerChild.click(function() {
                                    scrollContext.scrollTo(_stElem);
                                });
                            })(stElem);
                            
                            root.append(child);
                        }
                    }
                }
                else {
                    root.empty();
                }
            });
            
            return root;
        };

        return createStackTrace;
    }();

    return {
        createStackTrace: createStackTrace
    };
});
