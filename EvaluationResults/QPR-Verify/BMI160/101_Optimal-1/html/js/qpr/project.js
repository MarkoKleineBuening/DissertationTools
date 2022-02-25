/*
 * name: qpr/project.js
 * author: Carsten Sinz, Florian Merz, Calvin Urankar
 * description: javascript code for the project
 * version: 2.0
 *
 * The code in this file is neither allowed to call into the view
 * nor should it work in any way with DOM elements or
 * HTML specific parts of javascript.
 */

"use strict";

// oldTODO: remove the dependency on views. It really doesn't belong here.
define(["qpr/qpr", "qpr/utils", "qpr/views", "qpr/models"], function (qpr, utils, views, models) {

    var module = {};

    var baseDirectory = '../';

    //* Constructor for a collection model.
    //*
    //* properties should contain two members:
    //* * filename The file name where the collection is stored on disk.
    //* * parse A function for parsing the data from the resource,
    //*   which takes an XML (or JSON) document as input and returns
    //*   an object representing the parsed information.
    //*
    //* Additionally, the members fetch and get can be overwritten if needed.
    function Collection(properties) {
        var collection = this;
        $.each(properties, function (id, property) {
            collection[id] = property;
        });
    };

    Collection.prototype = {
        //* Fetch the Collection from a local or remote source.
        //*
        //* This is called by get, when the Collection is not already fetched.
        fetch: function (callback) {
            return $.get(baseDirectory + this.filename + ".xml", callback.bind(this));
        },
        //* Calls fetch, then parse so that the result can be used properly.
        get: function (callback) {
            // if the resource has a parser, load and parse the resource
            // then return the parsed resource
            // if the resource is already parsed, simply return it

            // create a promise which will be returned to the caller
            var deferred = $.Deferred();
            deferred.done(callback);

            // Resource already cached: resolve immediately
            if (this.hasOwnProperty('cache')) {
                deferred.resolve(this.cache);
                return deferred;
            }

            // Resource must first be loaded via ajax: defer resolving/rejecting
            this.fetch(function (doc) {
                var collection = this;
                // parse the document and call the callback on the result
                $.when(this.parse(doc))
                    .done(function (parsed) {
                        collection.cache = parsed;
                        deferred.resolve(collection.cache);
                    })
                    .fail(function (error) {
                        console.log("Parsing failed for resource");
                        deferred.reject(error);
                    });
            }).fail(function (jqXHR, textStatus, errorThrown) {
                // try to find the best possible error message
                if (!errorThrown && errorThrown != "") {
                    deferred.reject(errorThrown);
                } else if (textStatus != "error") {
                    deferred.reject(textStatus);
                } else {
                    deferred.reject("Failed accessing data");
                }
            });

            return deferred;
        }
    }

    module.sourceCodeXML = new Collection({
        // not used
        filename: utils.getQueryStrings()['fileID'] || 1,
        fetch: function (callback) {
            return $.get(baseDirectory + "files/" + utils.getQueryStrings()['fileID'] + ".xml", callback.bind(this));
        },
        parse: function (doc) {
            var deferred = $.Deferred();

            module.getChecks()
                .done(function (checks) {
                    var lines = [];
                    //create xml doc with jQuery
                    var xmlDoc = $.parseXML(doc);
                    var $xml;
                    // xml Document already preparsed
                    if (xmlDoc == null) $xml = $(doc);
                    // xml not already preparsed
                    else $xml = $(xmlDoc);

                    var $root = $xml.find('SourceFile');
                    $root.children().each(function (index, xmlLine) {
                        // go through checkRefs in a line if any
                        $(xmlLine).children().each(function (index, checkRef) {
                            var ids = $(checkRef).attr('ids').split(',');
                            // offset for tooltips
                            var offset = 330;
                            // go through ids and add check information
                            ids.forEach(function (id) {
                                var check = checks[id];
                                var text = $(checkRef).text();

                                /**
                                 * code to get the flag annotations
                                var flags = [];
                                if (check.flags.length == 0) {
                                    flags.push('none');
                                }
                                else {
                                    check.flags.forEach(function(flag, index) {
                                        flags.push(qpr.checkAnnotations[flag].name);
                                    });
                                }*/

                                // adds class for colored borders and adds tooltips
                                $(checkRef).text('<span class="ast mytooltip ' + check.status + '">' + text +
                                    '<span style="right: -' + offset + ';" class="tooltiptext">' +
                                    'CheckID: ' + check.id + '<br>Category: ' + qpr.checkCategories[check.category].name +
                                    '<br>Status: ' + check.status + '<br>Flags: ' + check.flags.toString() +
                                    '<br>Scope: ' + check.scope + '<br>Annotations: ' + check.annotations +
                                    '</span></span>');
                                offset += 310;
                            });
                        });
                        var line = {
                            lineNumber: $(xmlLine).attr('number'),
                            text: $(xmlLine).text()
                        }
                        lines.push(line);
                    });
                    deferred.resolve(lines);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });


            return deferred;
        },
        // overwrite to avoid loading the same xml even if file changes
        get: function (callback) {
            // create a promise which will be returned to the caller
            var deferred = $.Deferred();
            deferred.done(callback);

            this.fetch(function (doc) {
                var collection = this;
                // parse the document and call the callback on the result
                $.when(this.parse(doc))
                    .done(function (parsed) {
                        collection.cache = parsed;
                        deferred.resolve(collection.cache);
                    })
                    .fail(function (error) {
                        console.log("Parsing failed for resource");
                        deferred.reject(error);
                    });
            }).fail(function (jqXHR, textStatus, errorThrown) {
                // try to find the best possible error message
                if (!errorThrown && errorThrown != "") {
                    deferred.reject(errorThrown);
                } else if (textStatus != "error") {
                    deferred.reject(textStatus);
                } else {
                    deferred.reject("Failed accessing data");
                }
            });

            return deferred;
        }
    });

    /**
     * parses Configuration file and returns object with the attributes and values
     */
    module.configuration = new Collection({
        filename: "configuration",
        parse: function (doc) {
            var configuration = {};
            //create xml doc with jQuery
            var xmlDoc = $.parseXML(doc);
            var $xml;
            // xml Document already preparsed
            if (xmlDoc == null) $xml = $(doc);
            // xml not already preparsed
            else $xml = $(xmlDoc);

            //go through attributes and add them to object
            var $root = $xml.find('Configuration');
            $root.children().each(function () {
                configuration[this.tagName + ":"] = $(this).attr('value');
            });

            return configuration;
        }
    });

    /**
     * parses compilecommands file and returns collection with the commands and values for each command
     */
    module.compileunits = new Collection({
        filename: "compilecommands",
        parse: function (doc) {
            var compileUnits = [];

            $(doc).find('CompileCommand').each(function (index, element) {
                var $element = $(element);
                compileUnits.push({
                    index: index + 1,
                    filename: $element.attr('filename'),
                    directory: $element.attr('directory'),
                    commandline: $element.attr('commandline'),
                    state: $element.attr('state'),
                });
            });

            return compileUnits;
        }
    });

    /**
     * parses files file and adds file objects to collection.
     * collection with file object is returned
     */
    module.files = new Collection({
        filename: "files",
        parse: function (doc) {
            var files = {};

            $(doc).find('File').each(function () {
                var $this = $(this);
                var file = new models.File(
                    $this.attr('id'),
                    $this.attr('directory'),
                    $this.attr('filename')
                );

                files[file.id] = file;
            });

            return files;
        }
    });

    /// Filenames might deviate from the resource names.
    module.locations = new Collection({
        filename: "locations",
        parse: function (doc) {
            var deferred = $.Deferred();

            module.getFiles()
                .done(function (files) {
                    // process Real locations
                    var locations = {};

                    $(doc).find('Location').each(function () {
                        var $location = $(this);
                        var locationID = $location.attr('id');
                        var $fileLoc = $location.find('Real');
                        var $macroLoc = $location.find('Macro');
                        // is it a real file location?
                        if ($fileLoc.length == 1) {
                            var fileID = $fileLoc.attr('file');
                            // oldTODO: handle situation where file is not available gracefully
                            var file = files[fileID];
                            locations[locationID] = new models.FileLocation(
                                locationID,
                                file,
                                $fileLoc.attr('line'),
                                $fileLoc.attr('column')
                            );
                            // or a macro?
                        } else if ($macroLoc.length == 1) {
                            // handle the macro location
                            locations[locationID] = new models.MacroLocation(
                                locationID,
                                locations[$macroLoc.attr('spelling')],
                                locations[$macroLoc.attr('expansion')]
                            );
                        } else {
                            console.log("Location to parse seems to be neither a location nor a macro. \nMaybe the file is corrupt!");
                        }
                    });

                    deferred.resolve(locations);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });

            return deferred;
        }
    });

    /**
     * Parses compiler.xml and returns collection with the compiler messages information
     */
    module.compilermessages = new Collection({
        filename: "compiler",
        parse: function (doc) {
            var compilerMessages = {}
            $(doc).find('Check').each(function () {
                var $message = $(this);
                var id = $message.attr('id');
                compilerMessages[id] = {
                    id: id,
                    location: $message.attr('location'),
                    category: $message.attr('category'),
                    status: $message.attr('status'),
                    text: $message.find('Annotation').html()
                };
            });

            return compilerMessages;
        }
    });


    //* Splits a check status into a main status and annotations.
    //* Used by the check parser to split the status stored in the xml files
    //* for use in the GUI.
    function splitCheckStatus(fullStatus) {
        var flags = fullStatus.split('|');
        var originalStatus = flags.shift();
        var status;

        switch (originalStatus) {
            case '': { status = 'internalError'; break }
            case 'todo': { status = 'toDo'; break; }
            case 'safe': { status = 'safe'; break; }
            case 'unsafe': { status = 'unsafe'; break; }
            case 'unknown': { status = 'unknown'; break; }
            case 'unsupported': { status = 'unsupported'; break; }
            case 'notyetsupported': { status = 'notyetsupported'; break }
            case 'internalerror': { status = 'internalError'; break; }
            default: { status = 'internalError'; break; }
        }

        if (status != 'internalError' && status != 'toDo') {
            var moveToUnknown = ['timeout', 'memoryout', 'unknown'];
            var moveToCondSafe = ['loopboundreached', 'callstackboundreached', 'functionbodymissing',
                'inlineassembly', 'floatingpointabstraction'];
            var moveToCondUnsafe = ['locally', 'functionbodymissing', 'inlineassembly',
                'floatingpointabstraction'];

            // adapt main status based on annotations
            if (utils.intersectionNonEmpty(flags, moveToUnknown)) {
                status = 'unknown';
            } else if (status == 'safe' && utils.intersectionNonEmpty(flags, moveToCondSafe)) {
                status = 'condSafe';
            } else if (status == 'unsafe' && utils.intersectionNonEmpty(flags, moveToCondUnsafe)) {
                status = 'condUnsafe';
            }
        }

        return { status: status, flags: flags };
    }

    /**
     * Parses checks.xml and returns collection with checks and checkinformation
     */
    module.checks = new Collection({
        filename: "checks",
        parse: function (doc) {
            var deferred = $.Deferred();

            module.getLocations()
                .done(function (locations) {
                    var checks = {};

                    $(doc).find('Check').each(function () {
                        var $xml = $(this);
                        var splitStatus = splitCheckStatus($xml.attr('status'));

                        var locationID = $xml.attr('location');
                        // oldTODO: handle situation where no location is available (use sentinel location)
                        var location = locations[locationID];
                        var check = new models.Check(
                            $xml.attr('id'),
                            location,
                            $xml.attr('category'),
                            splitStatus.status,
                            splitStatus.flags,
                            $xml.attr('scope')
                        );

                        $xml.find('Trace').each(function () {
                            check.addTrace($(this).html());
                        });

                        $xml.find('Annotation').each(function () {
                            check.addAnnotation($(this).html());
                        });

                        checks[check.id] = check;
                    })

                    deferred.resolve(checks);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });

            return deferred;
        }
    });


    module.polyspace = new Collection({
        filename: "polyspace",
        parse: function (doc) {
            var deferred = $.Deferred();
            module.getChecks()
                .done(function (qprChecks) {
                    var polyspaceChecks = {};

                    $(doc).find('PolyspaceCheck').each(function () {
                        var $node = $(this);

                        // parse a polyspace check into our own datastructure
                        var polyspaceCheck = {
                            id: $node.attr('id'),
                            filename: $node.attr('filename'),
                            line: $node.attr('line'),
                            column: $node.attr('column'),
                            color: $node.attr('status'),
                            kind: $node.attr('kind'),
                            checks: []
                        };

                        // also the referenced checks
                        // checks currently referenced by their id
                        $node.find('CheckRef').each(function () {
                            var checkID = $(this).attr('id');
                            var qprCheck = qprChecks[checkID];
                            polyspaceCheck.checks.push(qprCheck);
                        });

                        polyspaceChecks[polyspaceCheck.id] = polyspaceCheck;
                    });

                    deferred.resolve(polyspaceChecks);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });

            return deferred;
        }
    });

    module.getConfiguration = function (callback) {
        return module.configuration.get(callback);
    };

    module.getCompileUnits = function (callback) {
        return module.compileunits.get(callback);
    };

    module.getFiles = function (callback) {
        return module.files.get(callback);
    };

    module.getLocations = function (callback) {
        return module.locations.get(callback);
    };

    module.getChecks = function (callback) {
        return module.checks.get(callback);
    };

    module.getCompilerMessages = function (callback) {
        return module.compilermessages.get(callback);
    };

    module.getPolyspaceChecks = function (callback) {
        return module.polyspace.get(callback);
    };

    //* Constructor for LoadableOnDemand (see below).
    module.LoadableOnDemand = function (loader) {
        this.cache = undefined;
        this.loader = loader;
    }

    //* LoadableOnDemand makes it easy to treat information that is
    //* computed on demand from other resource to be treated as a
    //* resource of its own.
    module.LoadableOnDemand.prototype = {
        get: function () {
            if (this.deferred == undefined) {
                this.deferred = $.Deferred();
                this.loader(this.deferred);
            }

            return this.deferred;
        }
    }

    module.functions = new module.LoadableOnDemand(function (deferred) {
        // functions need to be calculated
        module.getChecks(function (checks) {
            var functions = [];

            $.each(checks, function (index, check) {
                if ($.inArray(check.scope, functions) == -1) {
                    functions.push(check.scope)
                }
            })

            this.cache = functions;
            deferred.resolve(functions);

        }).fail(function (error) {
            deferred.reject(error);
        });
    });

    module.checkStatistics = new module.LoadableOnDemand(function (deferred) {
        $.when(module.getFiles(), module.checkCounts.get(), module.getChecks())
            .done(function (files, checkCounts, checks) {
                var statistics = [
                    {
                        label: "Files checked",
                        value: Object.keys(files).length
                    }, {
                        label: "Functions checked",
                        value: checkCounts.functions.length
                    }, {
                        label: "Lines of code checked",
                        value: undefined
                    }, {
                        label: "Total number of checks",
                        value: Object.keys(checks).length
                    }, {
                        label: "Checks still to do",
                        value: checkCounts.checksPerStatus.toDo
                    }
                ];

                this.cache = statistics;
                deferred.resolve(statistics);
            })
            .fail(function (error) {
                deferred.reject(error);
            });
    });

    /**
     * calculate amounts of checks per file, function, status and category
     * !also sets up list of functions as it is convenient to do that here!
     */
    module.checkCounts = new module.LoadableOnDemand(function (deferred) {
        module.getChecks()
            .done(function (checks) {
                var checkCounts = {
                    checksPerFunction: {},
                    checksPerFile: {},
                    checksPerStatus: {},
                    checksPerCategory: {},
                    functions: []
                };

                // first set to empty
                $.each(qpr.accumulatedStatus, function (key, val) {
                    checkCounts.checksPerStatus[key] = 0;
                });
                $.each(qpr.checkCategories, function (key, val) {
                    checkCounts.checksPerCategory[key] = 0;
                });

                $.each(checks, function (checkID, check) {
                    // accumulate checksPerFunction
                    var func = check.scope || '[no function]';
                    if (func in checkCounts.checksPerFunction) {
                        checkCounts.checksPerFunction[func]++;
                    } else {
                        checkCounts.checksPerFunction[func] = 1;
                    }

                    // accumulate checksPerFile
                    var file = check.getExpansionLocation().file;
                    if (file.id in checkCounts.checksPerFile) {
                        checkCounts.checksPerFile[file.id]++;
                    } else {
                        checkCounts.checksPerFile[file.id] = 1;
                    }

                    // fill checksPerStatus
                    checkCounts.checksPerStatus[check.status]++;

                    checkCounts.checksPerCategory[check.category]++;

                    // get functions
                    if ($.inArray(check.scope, checkCounts.functions) == -1) {
                        checkCounts.functions.push(check.scope);
                    }
                });

                this.cache = checkCounts;
                deferred.resolve(checkCounts);
            })
            .fail(function (error) {
                deferred.reject(error);
            });
    });

    module.categoryFilter = new module.LoadableOnDemand(function (deferred) {
        $.when(module.checkCounts.get())
            .done(function (checkCounts) {
                var items = {};
                $.each(qpr.checkCategories, function (key, value) {
                    items[key] = {
                        name: value.name,
                        badge: checkCounts.checksPerCategory[key],
                        defaultOn: true
                    }
                });

                this.cache = new models.Filter(items);
                deferred.resolve(this.cache);
            })
            .fail(function (error) {
                console.log(error);
                deferred.reject(error);
            });
    });

    /**
     * setup filter by status
     */
    module.checkStatusFilter = new module.LoadableOnDemand(function (deferred) {
        $.when(module.checkCounts.get())
            .done(function (checkCounts) {
                var items = {};
                $.each(qpr.accumulatedStatus, function (key, value) {
                    items[key] = {
                        name: value.name,
                        badge: checkCounts.checksPerStatus[key],
                        defaultOn: true
                    };
                });

                this.cache = new models.Filter(items);
                deferred.resolve(this.cache);
            })
            .fail(function (error) {
                console.log(error);
                deferred.reject(error);
            });
    });

    // setup filter by file
    module.sourceFileFilter = new module.LoadableOnDemand(function (deferred) {
        $.when(module.getFiles(), module.checkCounts.get())
            .done(function (files, checkCounts) {

                var items = {};
                $.each(files, function () {
                    items[this.id] = {
                        name: this.filename,
                        badge: checkCounts.checksPerFile[this.id],
                        defaultOn: true
                    }
                });

                this.cache = new models.Filter(items);
                deferred.resolve(this.cache);
            })
            .fail(function (error) {
                console.log(error);
                deferred.reject(error);
            });
    });

    // setup filter by function
    module.functionFilter = new module.LoadableOnDemand(function (deferred) {
        $.when(module.checkCounts.get())
            .done(function (checkCounts) {

                var items = {};
                $.each(checkCounts.functions, function () {
                    items[this] = {
                        name: this,
                        badge: checkCounts.checksPerFunction[this],
                        defaultOn: true
                    }
                });

                this.cache = new models.Filter(items);
                deferred.resolve(this.cache);
            })
            .fail(function (error) {
                console.log(error);
                deferred.reject(error);
            });
    });

    return module;
});
