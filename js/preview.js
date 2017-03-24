'use strict';
/**
 * Implements the preview split mode
 */
// TODO: Redo all of this, it's messy and buggy

const path = require('path');

const split = require('./split');
const resetEditorDiv = split.resetEditorDiv;
const switchSplit = split.switchSplit;
const state = require('./state');
const editor = require('./editor');
const command = require('./command');
const eventbus = require('./eventbus');
const nodeFs = require('fs');

var previewWrapperEl;
var previewEl;
var previewScrollY = 0;

eventbus.declare("preview");

var api = {
    hook: function() {
        eventbus.on("allsessionsloaded", function() {
            previewScrollY = state.get("preview.scrollY") || 0;
            var splitState = state.get("split");
            if (splitState && ("" + splitState).indexOf("preview-") === 0) {
                splitPreview(parseInt(splitState.substring("preview-".length), 10));
            }
        });
        eventbus.on("splitchange", function(type) {
            if (type.indexOf("preview-") === -1) {
                // Not a preview split, hide the preview
                previewWrapperEl.hide();
            }
        });
        eventbus.on("sessionchanged", delayedUpdate);
        eventbus.on("switchsession", delayedUpdate);
    },
    init: function() {
        var data = "data:text/html," + nodeFs.readFileSync(path.join(__dirname, '..', "preview.html"), {encoding: 'utf-8'});
        if(window.isNodeWebkit) {
            previewWrapperEl = $("<div id='preview-wrapper' class='preview-vsplit2-right'><iframe id='preview'>").hide();
        } else {
            previewWrapperEl = $("<div id='preview-wrapper' class='preview-vsplit2-right'><webview id='preview'>").hide();
        }
        $("#editor-wrapper").append(previewWrapperEl);
        previewEl = $("#preview");
        previewEl.attr("src", data);
    },
    showPreview: function(html, open) {
        function inject() {
            previewEl[0].contentWindow.postMessage({
                content: html
            }, "*");
        }

        if (open && !isPreviewing()) {
            splitPreview();

            // TODO: Not so nice. Will be removed
            // when this component receives a refactoring.
            return setTimeout(inject, 800);
        }

        inject();
    },
};

function isPreviewing() {
    var splitState = state.get("split");
    return splitState && ("" + splitState).indexOf("preview-") === 0;
}

function update() {
    if (!isPreviewing()) {
        return;
    }
    var session = editor.getActiveSession();
    eventbus.emit("preview", session);
}

var delayedUpdate = _.debounce(update, 500);

function splitPreview(style) {
    if (style === undefined) {
        var currentSplit = "" + state.get("split") || "";
        if (currentSplit.indexOf("preview-") === 0) {
            // Increase by one
            style = (parseInt(currentSplit.substring("preview-".length), 10) + 1) % 3;
        } else {
            style = 0;
        }
    }
    state.set("split", "preview-" + style);
    resetEditorDiv($("#editor0")).addClass("editor-vsplit2-left-" + style);
    resetEditorDiv($("#editor1")).addClass("editor-disabled");
    resetEditorDiv($("#editor2")).addClass("editor-disabled");
    previewWrapperEl.attr("class", "preview-vsplit2-right-" + style);
    previewWrapperEl.show();

    var editors = editor.getEditors(true);
    var activeEditor = editor.getActiveEditor();
    if (editors[0] !== activeEditor) {
        var session = activeEditor.getSession();
        activeEditor.setSession(editors[0].getSession());
        editors[0].setSession(session);
    }

    editor.getEditors(true).forEach(function(editor) {
        editor.resize();
    });
    switchSplit();
    eventbus.emit("splitchange", "preview-" + style);
    setTimeout(update, 200);
}



command.define("Split:Preview", {
    doc: "Open a split pane with a preview of the current document.",
    exec: function() {
        splitPreview();
    },
    readOnly: true
});

module.exports = api;
