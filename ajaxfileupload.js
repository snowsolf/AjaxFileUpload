/**
 * https://github.com/carlcarl/AjaxFileUpload
 */
jQuery.extend({
    createUploadIframe: function(id) {
        //create frame
        var frameId = 'jUploadFrame' + id;
        
        // The iframe must be appended as a string otherwise IE7 will pop up the response in a new window
        // http://stackoverflow.com/a/6222471/268669
        var style = "display: none; position: absolute; top: -1000px; left: -1000px;";
        $("body").append('<iframe src="javascript:false;" name="' + frameId + '" id="' + frameId + '" style="' + style + '"></iframe>');
    },
    createUploadForm: function(id, fileElementId) {
        //create form
        var formId = 'jUploadForm' + id;
        var fileId = 'jUploadFile' + id;
        var form = $('<form action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');
        
        //set fileId to array
        if(typeof(fileElementId) == 'string') {
            fileElementId = [fileElementId];
        }
        
        for(var i in fileElementId) {
            var oldElement = $('#' + fileElementId[i]);
            var newElement = $(oldElement).clone();
            $(oldElement).attr('id', fileId + "_" + i);
            $(oldElement).before(newElement);
            $(oldElement).appendTo(form);
        }
        
        //set attributes
        $(form).css('position', 'absolute');
        $(form).css('top', '-1200px');
        $(form).css('left', '-1200px');
        $(form).appendTo('body');
        return form;
    },
    addOtherRequestsToForm: function(form, data) {
        // add extra parameter
        var originalElement = $('<input type="hidden" name="" value="">');
        for(var key in data) {
            var name = key;
            var value = data[key];
            var cloneElement = originalElement.clone();
            cloneElement.attr({'name':name, 'value':value});
            $(cloneElement).appendTo(form);
        }
        return form;
    },

    ajaxFileUpload: function(s) {
        // TODO introduce global settings, allowing the client to modify them for all requests, not only timeout
        s = jQuery.extend({}, jQuery.ajaxSettings, s);
        var id = new Date().getTime();
        var form = jQuery.createUploadForm(id, s.fileElementId);
        if(s.data) {
            form = jQuery.addOtherRequestsToForm(form, s.data);
        }
        jQuery.createUploadIframe(id);
        var frameId = 'jUploadFrame' + id;
        var formId = 'jUploadForm' + id;
        // Watch for a new set of requests
        if(s.global && ! jQuery.active++) {
            jQuery.event.trigger("ajaxStart");
        }
        var requestDone = false;
        // Create the request object
        var xml = {};
        if(s.global) {
            jQuery.event.trigger("ajaxSend", [xml, s]);
        }
        // Wait for a response to come back
        var uploadCallback = function(isTimeout) {
            var io = document.getElementById(frameId);
            try {
                if(io.contentWindow) {
                    xml.responseText = io.contentWindow.document.body?io.contentWindow.document.body.innerHTML:null;
                    xml.responseXML = io.contentWindow.document.XMLDocument?io.contentWindow.document.XMLDocument:io.contentWindow.document;

                } else if(io.contentDocument) {
                    xml.responseText = io.contentDocument.document.body?io.contentDocument.document.body.innerHTML:null;
                    xml.responseXML = io.contentDocument.document.XMLDocument?io.contentDocument.document.XMLDocument:io.contentDocument.document;
                }
            } catch(e) {
                jQuery.handleError(s, xml, null, e);
            }
            if(xml || isTimeout == "timeout") {
                requestDone = true;
                var status;
                try {
                    status = isTimeout != "timeout" ? "success" : "error";
                    // Make sure that the request was successful or notmodified
                    if(status != "error") {
                        // process the data (runs the xml through httpData regardless of callback)
                        var data = jQuery.uploadHttpData(xml, s.dataType);
                        // If a local callback was specified, fire it and pass it the data
                        if(s.success) {
                            s.success(data, status);
                        }

                        // Fire the global callback
                        if(s.global) {
                            jQuery.event.trigger("ajaxSuccess", [xml, s]);
                        }
                    } else {
                        jQuery.handleError(s, xml, status);
                    }
                } catch(e) {
                    status = "error";
                    jQuery.handleError(s, xml, status, e);
                }

                // The request was completed
                if(s.global) {
                    jQuery.event.trigger("ajaxComplete", [xml, s]);
                }

                // Handle the global AJAX counter
                if(s.global && ! --jQuery.active) {
                    jQuery.event.trigger("ajaxStop");
                }

                // Process result
                if(s.complete) {
                    s.complete(xml, status);
                }

                jQuery(io).unbind();

                setTimeout(function() {
                    try {
                        $(io).remove();
                        $(form).remove();
                    } catch(e) {
                        jQuery.handleError(s, xml, null, e);
                    }
                }, 100);

                xml = null;
            }
        };
        // Timeout checker
        if(s.timeout > 0) {
            setTimeout(function() {
                // Check to see if the request is still happening
                if(!requestDone) uploadCallback("timeout");
            }, s.timeout);
        } try {
            // var io = $('#' + frameId);
            var form = $('#' + formId);
            $(form).attr('action', s.url);
            $(form).attr('method', 'POST');
            $(form).attr('target', frameId);
            if(form.encoding) {
                form.encoding = 'multipart/form-data';
            } else {
                form.enctype = 'multipart/form-data';
            }
            $(form).submit();
        } catch(e) {
            jQuery.handleError(s, xml, null, e);
        }
        if(window.attachEvent) {
            document.getElementById(frameId).attachEvent('onload', uploadCallback);
        } else {
            document.getElementById(frameId).addEventListener('load', uploadCallback, false);
        }
        return {abort: function () {}};
    },

    uploadHttpData: function(r, type) {
        var data = !type;
        data = type == "xml" || data ? r.responseXML : r.responseText;
        // If the type is "script", eval it in global context
        if(type == "script") {
            jQuery.globalEval(data);
        }
        // Get the JavaScript object, if JSON is used.
        if(type == "json") {
            // If you add mimetype in your response,
            // you have to delete the '<pre></pre>' tag.
            // The pre tag in Chrome has attribute, so have to use regex to remove
            data = r.responseText;
            var rx = new RegExp("<pre.*?>(.*?)</pre>", "i");
            var am = rx.exec(data);
            //this is the desired data extracted
            data = (am) ? am[1] : data;//the only submatch or empty
            try {
                eval("data = " + data);
            } catch (e) {
                //If the data not json, return string
            }
        }
        // evaluate scripts within html
        if(type == "html") {
            jQuery("<div>").html(data).evalScripts();
        }
        
        return data;
    }
});
