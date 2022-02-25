var dependencies = ['underscore',
                    'utils',
                    './StepRenderers',
                    './TraceElement',
                    './StepMorph',
                    './ScrollContext',
                    './CallMorph'];

define(dependencies, function(_, utils, stepRenderersPkg, TraceElementPkg,
                              StepMorphPkg, ScrollContextPkg, CallMorphPkg) {
    var render = function() {
        var rendererMetaClasses = _.extend(stepRenderersPkg,
                                           {Step: StepMorphPkg.StepMorph,
                                            Call: CallMorphPkg.CallMorph});
        
        function render(parent, traceElem) {
            var tagName = traceElem.typeName;
            if (!rendererMetaClasses.hasOwnProperty(tagName)) {
                throw "Don't know how to render a " + tagName;
            }

            return new rendererMetaClasses[tagName](parent, traceElem);
        };

        return render;
    }();

    function createRenderNode(traceElem) {
        var result = render(TraceElementPkg.TraceElement.ROOT, traceElem);
        result.setRenderer(render);
        return result;
    };

    return {
        createRenderNode: createRenderNode,
        ScrollContext: ScrollContextPkg.ScrollContext,
        TraceElement: TraceElementPkg.TraceElement
    };
});
