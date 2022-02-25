var dependencies = ['underscore',
                    'utils',
                    './StepRenderers',
                    './TraceElement']

define(dependencies, function(_, utils, stepRenderers, TraceElementPkg) {
    var TraceElement = TraceElementPkg.TraceElement;

    var rendererMetaClasses = stepRenderers;
    
    var StepMorph = function() {
        function DefaultMorphTarget (parent, traceElem) {
            TraceElement.call(this, parent, traceElem);
        };

        DefaultMorphTarget.prototype = Object.create(TraceElement.prototype);
        DefaultMorphTarget.prototype.constructor = TraceElement;

        DefaultMorphTarget.prototype.getDOMElement = function() {
            var result = $("<div>");
            result.addClass("twNonNestedStep");

            var italic = $("<i>");
            
            italic.append("Internal error: StepMorph: Could not morph into a "
                          + ((this._traceElem === undefined) ?
                             "[undefined trace element]" : this._traceElem.typeName) );
            result.append(italic);
            
            return result;
        }

        DefaultMorphTarget.prototype.render = function() {};

        DefaultMorphTarget.prototype.setStepTraceElement = function() {};

        var genLabelCount = 0;
        function generateLabel() {
            return genLabelCount++;
        };
        
        function StepMorph(parent, traceElem) {
            var targetTraceElem = traceElem.getInLabelChild();
            var tagName = (targetTraceElem !== undefined)
                ? targetTraceElem.typeName : undefined;
            var targetMetaclass;
            if (!rendererMetaClasses.hasOwnProperty(tagName)) {
                targetMetaclass = DefaultMorphTarget;
            }
            else {
                if (tagName == "Step") {
                    throw "Cannot morph into myself.";
                }
                targetMetaclass = rendererMetaClasses[tagName];
            }
            
            // We will become the desired renderer after this.
            var constructor = utils.morph(this, targetMetaclass);
            constructor(parent, targetTraceElem);

            if (traceElem.getLabel() !== undefined) {
                // This works due to morphing.
                this.setLabel(traceElem.getLabel());
            }
            else {
                this.setLabel("Label " + generateLabel());
            }

            this.setStepTraceElement(traceElem);
           
        };

        return StepMorph;
    }();

    return {
        StepMorph: StepMorph
    };
});
