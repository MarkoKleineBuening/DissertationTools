"use strict";

var dependencies = ['underscore', 'utils'];

define(dependencies, function(_, utils) {

    function loadXMLFile(xmlFileURI, recvFn) {
        $.ajax({url: xmlFileURI,
                dataType: 'xml',
                success: function(xmlData) {
                    recvFn(xmlData);
                },

                error : function() {
                    console.log("Could not read " + xmlFileURI);
                    // Improved error handling required here, see issue QPR-20
                }
               });
    };

    var XMLObj = function () {
        function XMLObj(config) {
            utils.defConstant(this, "_document", config.document);
            utils.defConstant(this, "_path", config.path);
            utils.defConstant(this, "_element", config.element);
        };

        XMLObj.prototype.getPath = function() {
            return this._path;
        };

        XMLObj.prototype.getDocument = function() {
            return this._document;
        };

        XMLObj.prototype.getElement = function() {
            return this._element;
        };

        XMLObj.prototype.getAttribute = function(attribute) {
            return this._element.getAttribute(attribute);
        };

        XMLObj.prototype.hasAttribute = function(attribute) {
            return this.getAttribute(attribute) != undefined;
        }

        XMLObj.prototype.getArrayValues = function() {
            var childrenWithTag = _.filter(this._element.childNodes,
                                           function(childNode) {
                                               return childNode.tagName !== undefined;
                                           });
            

            var _this = this;
            return _.map(_.zip(childrenWithTag, _.range(1, childrenWithTag.length+1)),
                         function(childAndIdx) {
                             var child = childAndIdx[0];
                             var idx = childAndIdx[1];
                             
                             return new XMLObj({
                                 document: _this.getDocument(),
                                 path:  _this.getPath() + "/" + child.tagName
                                     + "[" + idx + "]",
                                 element: child
                             });
                         });
            
        };

        XMLObj.prototype.getChild = function(childPath) {
            var resultColl = _.filter(this._element.childNodes,
                                      function(childNode) {
                                          return childNode.tagName == childPath;
                                      });
            
            if (resultColl.length > 0) {   
                return new XMLObj({
                    element: resultColl[0],
                    path: this.getPath() + "/" + childPath,
                    document: this.getDocument()
                });
            }
            else {
                return undefined;
            }
        };

        XMLObj.prototype.hasChild = function(childPath) {
            try {
                return this.getChild(childPath) !== undefined;
            }
            catch (e) {
                return false;
            }
        };

        XMLObj.prototype.getChildTags = function() {
            var childrenWithTags = _.filter(this._element.childNodes,
                                            function(x) {
                                                return x.tagName !== undefined;
                                            });
            return _.map(childrenWithTags, function(x) {
                return x.tagName;
            });
        };

        XMLObj.prototype.getTagName = function() {
            return this._element.tagName;
        };

        return XMLObj;
    }();

    /**
     * retrieves an xml node
     * 
     * @param {any} document the xml document to be inspected 
     * @param {any} xpath the expression corresponding to the target xml node
     * @param {any} expectedTagName 
     * @returns 
     */
    function retrieve(document, xpath, /* optional */ expectedTagName) {        
        var element = document.evaluate(xpath,
                                        document,  
                                        null,
                                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                                        null);
        var result = {document: document,
                      path: xpath,
                      element: element.singleNodeValue
                     };
        if (result.element === null) {
            throw "No element found for path " + xpath;
        }

        if (expectedTagName !== undefined) {
            if (expectedTagName != result.element.tagName) {
                console.log(result);
                throw "Got element with tag " + result.element.tagName
                    + ", but expected tag " + expectedTagName;
            }
        }
        
        return new XMLObj(result);
    };

    return {
        loadXMLFile: loadXMLFile,
        retrieve: retrieve,
        XMLObj: XMLObj
    };

});
