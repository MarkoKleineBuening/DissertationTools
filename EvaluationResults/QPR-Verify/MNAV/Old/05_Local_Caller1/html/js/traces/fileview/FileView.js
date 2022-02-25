var dependencies = ['underscore',
                    'utils'];

define(dependencies, function(_, utils) {
    
    var TabbedView = function() {   
        var tabCounter = 0
        function createTab(filename) {
            var listElement = $("<li>");
            var tabID = "file" + (tabCounter++);
            var link = $("<a href=\"#" + tabID + "\" data-toggle=\"tab\">")
            link.append(filename);
            listElement.append(link);

            var container = $("<div id=\"" + tabID + "\">");
            container.addClass("tab-pane");

            return {
                listElement: listElement,
                contentContainer: container,

                setActive: function(active) {
                    if (active) {
                        listElement.addClass("active");
                        container.addClass("active");
                    }
                    else {
                        listElement.removeClass("active");
                        container.removeClass("active");
                    }
                }
            };
        };

        function createDOMElements() {
            var toplevel = $("<div>");
            
            var tabbar = $("<ul data-tabs=\"tabs\">");
            tabbar.addClass("nav");
            tabbar.addClass("nav-tabs");

            var tabContent = $("<div>");
            tabContent.addClass("tab-content");
            //tabContent.css("position", "absolute");

            toplevel.append(tabbar);
            toplevel.append(tabContent);

            return {
                toplevelElement: toplevel,
                tabbar: tabbar,
                tabContent: tabContent,

                insertTab: function(tab) {
                    tabbar.append(tab.listElement);
                    tabContent.append(tab.contentContainer);
                }
            };
        };

        
        function TabbedView() {
            utils.defConstant(this, "_domElems", createDOMElements());
            utils.defConstant(this, "_tabsByID", {});
        };

        TabbedView.prototype.addContent = function(id, title, div) {
            var newTab = createTab(title);
            this._tabsByID[id] = newTab;
            newTab.contentContainer.append(div);
            this._domElems.insertTab(newTab);
        };

        TabbedView.prototype.setActive = function(id) {
            for (var x in this._tabsByID) {
                if (x == id) {
                    this._tabsByID[x].setActive(true);
                }
                else {
                    this._tabsByID[x].setActive(false);
                }
            }
            this._active = id;
        };

        TabbedView.prototype.getActive = function() {
            return this._active;
        };

        TabbedView.prototype.getDOMElement = function() {
            return this._domElems.toplevelElement;
        };
        
        return TabbedView;
    }();

    var FileContentView = function() {
        function addLinesToDiv(contentList, div) {
            var table = $("<div>");
            div.append(table);
            table.css("display", "table");
            table.css("border-spacing", "1em 0em");
            
            var result = _.map(_.zip(contentList, _.range(contentList.length)),
                               function(line) {
                                   
                                   var row = $("<div>");
                                   row.css("display", "table-row");
                                   
                                   var lineNo = $("<div>");
                                   lineNo.addClass("fvLineNumber");
                                   lineNo.css("display", "table-cell");
                                   lineNo.css("border-right", "0.1em solid #ddd");
                                   
                                   lineNo.append(line[1]+1);

                                   var lineProper = $("<div>");
                                   lineProper.addClass("fvCode");
                                   lineProper.css("display", "table-cell");
                                   
                                   lineProper.append(line[0]);

                                   table.append(row);
                                   row.append(lineNo);
                                   row.append(lineProper);

                                   return lineProper;
                               });
            return result;
        };
        
        function FileContentView(contentList) {
            utils.defConstant(this, "_contentList", contentList);
            utils.defConstant(this, "_domElem", $("<div>"));
            this._domElem.addClass("fvFileContents");
            utils.defConstant(this, "_divByLineNo",
                              addLinesToDiv(this._contentList, this._domElem));
            utils.defConstant(this, "_currentHighlight", []);
        };

        FileContentView.prototype.getDOMElement = function() {
            return this._domElem;
        };

        utils.defConstant(FileContentView, "HIGHLIGHT_STYLES", {
            regular: "fvHighlightedLine",
            failure: "fvHighlightedLineFailure"
        });

        FileContentView.prototype.highlightLine = function(lineNo, amount,
                                                           /* optional */ style) {
            var style = (style === undefined) ?
                FileContentView.HIGHLIGHT_STYLES.regular : style;

            var lineNoInt = parseInt(lineNo);
            this._currentHighlight.length = 0;
            
            _.each(_.range(lineNoInt - 1, lineNoInt - 1 + amount), function(index) {
                var highlightedDiv = this._divByLineNo[index];
                this._currentHighlight.push(highlightedDiv);
                highlightedDiv.addClass(style);
            }, this);
        };

        FileContentView.prototype.clearHighlight = function() {
            _.each(this._currentHighlight, function(highlightedDiv) {
                _.each(FileContentView.HIGHLIGHT_STYLES, _.bind(function(cssClass) {
                    highlightedDiv.removeClass(cssClass);
                }, this));
            }, this);
            this._currentHighlight.length = 0;
        };

        FileContentView.prototype.scrollToLine = function(lineNo) {
            var target = this._divByLineNo[lineNo-1];
            if (!target) {
                throw "No line present for line number " + lineNo;
            }
            if (!utils.isInView(target, this._domElem)) {
                this._domElem.scrollTo(target, 500, {offset: -150});
            }
        };

        return FileContentView;
    }();
    
    var FileView = function() {
        function FileView() {
            utils.defConstant(this, "_aggregatedView", new TabbedView());
            utils.defConstant(this, "_fileByPath", {});
        };
        
        FileView.prototype.getDOMElement = function() {
            return this._aggregatedView.getDOMElement();
        };

        FileView.prototype.addFile = function(pathAndContents) {
            var fileContentView = new FileContentView(pathAndContents.contents);
            var tab = this._aggregatedView.addContent(pathAndContents.path,
                                                      pathAndContents.shortName,
                                                      fileContentView.getDOMElement());
            this._fileByPath[pathAndContents.path] = fileContentView;
        };

        FileView.prototype.setFileVisible = function(path) {
            this._aggregatedView.setActive(path);
        };

        FileView.prototype.highlightLine = function(path, lineNumber, amount,
                                                    /* optional */ highlightStyle) {
            this._aggregatedView.setActive(path);
            this._fileByPath[path].highlightLine(lineNumber, amount, highlightStyle);
        };

        FileView.prototype.clearHighlight = function(path) {
            this._fileByPath[path].clearHighlight();
        };

        FileView.prototype.clearCurrentHighlight = function() {
            var active = this._aggregatedView.getActive();
            if (active) {
                this.clearHighlight(active);
            }
        }

        FileView.prototype.scrollToLine = function(path, lineNumber) {
            this._fileByPath[path].scrollToLine(lineNumber);
        };

        FileView.prototype.highlightAndScroll = function(path, lineNumber, amount,
                                                         /* optional */ highlightStyle) {
            this.highlightLine(path, lineNumber, amount, highlightStyle);
            this.scrollToLine(path, lineNumber);
        }
        


        return FileView;
    }();

    return {
        FileView: FileView,
        HighlightStyles: FileContentView.HIGHLIGHT_STYLES
    };
});

