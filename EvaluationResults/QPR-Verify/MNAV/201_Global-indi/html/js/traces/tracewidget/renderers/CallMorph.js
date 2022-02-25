var dependencies = ['underscore',
                    'utils',
                    './StepRenderers',
                    './TraceElement'];

define(dependencies, function(_, utils, StepRenderersPkg, TraceElementPkg) {
    var TraceElement = TraceElementPkg.TraceElement;

    var rendererMetaClasses = StepRenderersPkg;
    
    var CallMorph = function() {
        function CallMorph(parent, traceElem) {
            var targetTraceElem = traceElem.getActualCall();
            var tagName = (targetTraceElem !== undefined)
                ? targetTraceElem.typeName : undefined;
            if (tagName != "FunctionExecution") {
                throw "CallMorph only supports morphing to FunctionExecution. (Requested: " +
                    tagName + ")";
            }
            targetMetaclass = rendererMetaClasses[tagName];
            var constructor = utils.morph(this, targetMetaclass);
            constructor(parent, targetTraceElem);
        };

        return CallMorph;
    }();

    return {
        CallMorph: CallMorph
    };
});
