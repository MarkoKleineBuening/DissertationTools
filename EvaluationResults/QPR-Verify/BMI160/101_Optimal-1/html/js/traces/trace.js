"use strict";

$(document).ready(function() {

    var siteConfig = {
        fileDB: "../files.xml",
        fileDir: "../files/",
        traceDir: "../traces/"
    };

    function sourceFilename(fileID) {
        return siteConfig.fileDir + fileID + ".txt";
    };
    
    function traceFilename(traceID) {
        return siteConfig.traceDir + traceID + ".xml";
    };
    
    // RequireJS Setup
    
    requirejs.config({
        baseUrl: './js',
        paths: {
            underscore: "deps/underscore-min",
            radio: "deps/radio.min",      
            utils: "traces/tracewidget/utilities/utils",
            
            tracewidget: "traces/tracewidget",
            messaging: "traces/messaging"
        }
    });



    // File-loading helper functions
    
    function loadFile(path, pathAlias, shortName, recv) {
        $.ajax({url: path,
                dataType: 'text',
                success: function(text) {
                    recv({
                        path: pathAlias,
                        shortName: shortName,
                        contents: text.split("\n")
                    });
                },
                error: function() {
                    console.log("Could not read " + path);
                }
               });
    };
    
    function loadAllSourceFiles(XMLDataPkg, recvFn) {
        XMLDataPkg.loadXMLFile(siteConfig.fileDB, function(fileDB) {
            var files = XMLDataPkg.retrieve(fileDB, "/Files");
            var filesArray = files.getArrayValues();
            
            var loaderFunction = _.reduce(filesArray, function(memo, next) {
                return function(resultColl) {
                    resultColl = (resultColl === undefined) ? [] : resultColl;
                    
                    var virtualPath = next.getAttribute("id");
                    var shortName = next.getAttribute("filename");
                    var path = sourceFilename(virtualPath);

                    loadFile(path, virtualPath, shortName, function(file) {
                        resultColl.push(file);
                        memo(resultColl);
                    });
                };
            }, recvFn);

            loaderFunction();
        });
    };

    function getQueryStringArgs(url) {
        // oldTODO: Use URI.js to decode the URL. Importing URI.js currently causes
        // the require.js setup to malfunction; Probably, it's a conflict with
        // the 'utils' package alias, but require.js doesn't volunteer any
        // helpful information.
        var baseAndQuery = url.split("?", 2);
        if (baseAndQuery.length != 2) {
            throw "Required query string parameters missing.";
        }
        var removedAnchor = baseAndQuery[1].split("#", 2);
        
        return _.reduce(removedAnchor[0].split("&"),
                        function (memo, next) {
                            var keyAndVal = next.split("=", 2);
                            if (keyAndVal.length != 2) {
                                throw "Missing = in query string at " + next;
                            }
                            memo[keyAndVal[0]] = keyAndVal[1];
                            return memo;
                        }, {});
    };

    function getTraceXMLFilePath() {
        var rawURL = window.location.href;
        var queryArgs = getQueryStringArgs(rawURL);
        if (!queryArgs.hasOwnProperty("traceID")) {
            throw "Missing query string parameter traceID";
        }
        return queryArgs.traceID;
    }


    // Creates a tracewidget instance and embeds it in the div element having
    // the id "traceWidget".
    function prototypeMain(TraceWidgetPkg, XMLDataPkg) {
        var targetElement = $("#traceWidget");
        var createTraceWidget = TraceWidgetPkg.createTraceWidget;
        // makes sure ie can use xpath (unneccessary for other browsers :()
        // is used in retrieve() in XMLData.js which is eventually called to retrieve the xml Nodes
        wgxpath.install();
        loadAllSourceFiles(XMLDataPkg, function(sourceFiles) {
            var traceID = getTraceXMLFilePath();
            var filename = traceFilename(traceID);
            createTraceWidget(traceID,
                              filename,
                              sourceFiles,
                              function(tw) {
                                  targetElement.empty();
                                  targetElement.append(tw.getDOMElement());
                                  tw.firstTimeVisible();
                              });
        });
    };


    // Go!
    requirejs(['tracewidget/tracewidget',
               'tracewidget/xmltrace/XMLData'], prototypeMain);

});
