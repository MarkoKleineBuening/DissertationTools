/*
 * name: models.js
 * author: Florian Merz, Carsten Sinz
 * description: collection of the core models used in qpr.
 */

"use strict";

define(["qpr/qpr"], function(qpr)
{
    var module = {};

    //* constructor for File object
    //* call with 'new' keyword
    module.File = function(id, directory, filename) {
        this.id = id;
        this.directory = directory;
        this.filename = filename;
    }

    //* static properties of all File objects
    module.File.prototype = {
        getFullPath: function() {
            return this.directory + "/" + this.filename;
        },
        getContents: function() {
            // deferred loading of a file's contents.
            var deferred = $.Deferred();

            // already loaded, return it
            if (this.hasOwnProperty('contents')) {
                deferred.resolve(this.contents);
                return deferred.promise();
            }

            $.get(baseDirectory + "files/" + this.id + ".xml")
            .done(function(doc, textStatus, jqXHR) {
                var result = [];

                $(doc).find('Line').each(function(number, line) {
                    var resultLine = [];
                    resultLine.number = line.attributes['number'].value;
                    $(line).contents().each(function(index, part) {
                        var resultPart = {};
                        resultPart.text = part.textContent;
                        if (part.nodeType !== 3) {
                            if (part.nodeName == "CheckRefs") {
                                // this is a proper node part
                                resultPart.checks = part.attributes['ids'].value.split(',');
                            }
                        }
                        resultLine.push(resultPart);
                    });

                    result.push(resultLine);
                });

                // parse the document
                this.contents = result;
                deferred.resolve(this.contents);
            })
            .fail(function(jqXHR, textStatus, error) {
                if (!error && error != "") {
                    deferred.reject(error);
                } else if (textStatus != "error") {
                    deferred.reject(textStatus);
                } else {
                    deferred.reject("Failed accessing data");
                }
            });

            // asynchronously fetch the file's contents
            return deferred.promise();
        }
    };

    //* Constructor for FileLocation objects.
    //* always call with 'new' keyword.
    module.FileLocation = function(id, file, line, column) {
        this.id = id;
        this.file = file;
        this.line = line;
        this.column = column;
    };

    module.FileLocation.prototype = {
        getSpellingLocation: function() { return this; },
        getExpansionLocation: function() { return this; },

        isFile: function() { return true; },
        isMacro: function() { return false; },

        //* Returns the location's file id
        getFileID: function() { return this.file.id; }
    };

    //* Constructor for FileLocation objects.
    //* always call with 'new' keyword.
    module.MacroLocation = function(id, spelling, expansion) {
        this.id = id;
        this.spelling = spelling;
        this.expansion = expansion;
    };

    module.MacroLocation.prototype = {
        getSpellingLocation: function() { return this.spelling.getSpellingLocation(); },
        getExpansionLocation: function() { return this.expansion.getExpansionLocation(); },

        isFile: function() { return false; },
        isMacro: function() { return true; }
    };

    //* Constructor for Check objects.
    //* Always call with 'new' keyword.
    module.Check = function(id, location, category, status, flags, scope) {
        this.id = id;
        this.location = location;
        this.category = category;
        this.status = status;
        this.flags = flags;
        this.scope = scope;
        this.annotations = [];
        this.traces = [];
    }

    //* Static properties of all Check objects.
    module.Check.prototype = {
        addTrace: function(trace) {
            this.traces.push(trace);
        },
        addAnnotation: function(annotation) {
            this.annotations.push(annotation);
        },
        getDisplayStatus: function() {
            var annotationStatus = {}
            var check = this;
            $.each(qpr.checkAnnotations, function(annotation, _) {
                if (check.status == 'toDo' || check.status == 'internalError' || check.flags.indexOf(annotation) == -1) {
                    annotationStatus[annotation] = 'none'
                } else {
                    annotationStatus[annotation] = check.status
                }
            });
            return annotationStatus
        },
        getExpansionLocation: function() {
            return this.location.getExpansionLocation();
        }
    };


    //* Filters
    //*
    //* items is a map from an 'id' to a 'name', 'badge', 'defaultOn' triple.
    module.Filter = function(items) {
        this.items = items;

        // initialize the list of selected items
        var selectedItems = [];
        $.each(items, function(id, value) {
            if (value.defaultOn) {
                selectedItems.push(id);
            }
        });
        this.selection = selectedItems;
    };

    module.Filter.prototype = {
        match: function(item) {
            return $.inArray(item, this.selection) != -1;
        },
        reset: function() {
            this.selection = [];
        },
        add: function(item) {
            this.selection.push(item);
        },
        remove: function(item) {
            var index = $.inArray(item, this.selection);
            if (index != -1) {
                this.selection.splice(index, 1);
            }
        }
    };

    return module;
});
