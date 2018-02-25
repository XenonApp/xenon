'use strict';

module.exports = [{
    label: "File",
    submenu: [{
        label: "New",
        command: "File:New"
    }, {
        label: "Open (Goto)",
        command: "Navigate:Goto"
    }, {
        label: "Open (Tree)",
        command: "Navigate:File Tree"
    }, {
        type: 'separator'
    }, {
        label: "Delete",
        command: "File:Delete"
    }, {
        label: "Rename",
        command: "File:Rename"
    }, {
        label: "Copy",
        command: "File:Copy"
    }, {
        type: 'separator'
    }, {
        label: "Reload Filelist",
        command: "Navigate:Reload Filelist"
    }, {
        type: 'separator'
    }, {
        label: "Close",
        command: "Window:Close"
    }]
}, {
    label: "Edit",
    submenu: [{
        label: "Undo",
        command: "Edit:Undo"
    }, {
        label: "Redo",
        command: "Edit:Redo"
    }, {
        label: "Complete",
        command: "Edit:Complete"
    }, {
        label: "Multiple Cursors",
        submenu: [{
            label: "Add At Next Instance",
            command: "Cursor:Multiple:Add At Next Instance Of Identifier"
        }, {
            label: "Add At Previous Instance",
            command: "Cursor:Multiple:Add At Previous Instance Of Identifier"
        }, {
            label: "Add Above",
            command: "Cursor:Multiple:Add Above"
        }, {
            label: "Add Below",
            command: "Cursor:Multiple:Add Below"
        }, {
            label: "Add Above Skip Current",
            command: "Cursor:Multiple:Add Above Skip Current"
        }, {
            label: "Add Below Skip Current",
            command: "Cursor:Multiple:Add Below Skip Current"
        }, {
            label: "Align cursors",
            command: "Cursor:Multiple:Align cursors"
        }]
    }, {
        type: 'separator'
    }, {
        label: "Remove Line",
        command: "Edit:Remove Line"
    }, {
        label: "Toggle Comment",
        command: "Edit:Toggle Comment"
    }, {
        label: "Copy Lines Up",
        command: "Edit:Copy Lines Up"
    }, {
        label: "Move Lines Up",
        command: "Edit:Move Lines Up"
    }, {
        label: "Copy Lines Down",
        command: "Edit:Copy Lines Down"
    }, {
        label: "Move Lines Down",
        command: "Edit:Move Lines Down"
    }]
}, {
    label: "Goto",
    submenu: [{
        label: "Anything",
        command: "Navigate:Goto"
    }, {
        label: "Line",
        command: "Navigate:Line"
    }, {
        label: "Path Under Cursor",
        command: "Navigate:Path Under Cursor"
    }, {
        type: 'separator'
    }, {
        label: "Lookup Symbol",
        command: "Navigate:Lookup Symbol"
    }, {
        label: "Lookup Symbol In File",
        command: "Navigate:Lookup Symbol In File"
    }, {
        label: "Lookup Symbol Under Cursor",
        command: "Navigate:Lookup Symbol Under Cursor"
    }]
}, {
    label: "Find",
    submenu: [{
        label: "Find",
        command: "Find:Find"
    }, {
        label: "Find Case Insensitive",
        command: "Find:Find Case Insensitive"
    }, {
        type: 'separator'
    }, {
        label: "Next",
        command: "Find:Next"
    }, {
        label: "Previous",
        command: "Find:Previous"
    }, {
        label: "All",
        command: "Find:All"
    }, {
        type: 'separator'
    }, {
        label: "Next Instance Of Identifier",
        command: "Find:Next Instance Of Identifier"
    }, {
        label: "Previous Instance Of Identifier",
        command: "Find:Previous Instance Of Identifier"
    }, {
        type: 'separator'
    }, {
        label: "Find In Project",
        command: "Find:Find In Project"
    }]
}, {
    label: "Split",
    submenu: [{
        label: "One",
        command: "Split:One"
    }, {
        label: "Vertical Two",
        command: "Split:Vertical Two"
    }, {
        label: "Vertical Three",
        command: "Split:Vertical Three"
    }, {
        label: "Preview",
        command: "Split:Preview"
    }, {
        type: 'separator'
    }, {
        label: "Switch Focus",
        command: "Split:Switch Focus"
    }, {
        type: 'separator'
    }, {
        label: "Move To First",
        command: "Split:Move To First"
    }, {
        label: "Move To Second",
        command: "Split:Move To Second"
    }, {
        label: "Move To Third",
        command: "Split:Move To Third"
    }]
}, {
    label: "Tools",
    submenu: [{
        label: "Run Command",
        command: "Command:Enter Command"
    }, {
        type: 'separator'
    }, {
        label: "Beautify",
        command: "Tools:Beautify"
    }, {
        label: "Preview",
        command: "Tools:Preview"
    }, {
        label: "Compile",
        command: "Tools:Compile"
    }, {
        label: "Document Stats",
        command: "Tools:Document Statistics"
    }, {
        type: 'separator'
    }, {
        label: "Commit Changes",
        command: "Version Control:Commit"
    }, {
        label: "Reset Changes",
        command: "Version Control:Reset"
    }, {
        label: "Package Manager",
        command: "Tools:XeNPM:Installed Packages"
    }, {
        label: "Reindex Project",
        command: "Tools:Index Project"
    }, {
        type: 'separator'
    }, {
        label: "Show DevTools",
        command: "Development:Show DevTools"
    }]
}, {
    label: "Configuration",
    submenu: [{
        label: "Editor Theme",
        command: "Configuration:Preferences:Pick Editor Theme"
    }, {
        label: "Window Theme",
        command: "Configuration:Preferences:Pick Window Theme"
    }, {
        type: 'separator'
    }, {
        label: "Increase Font Size",
        command: "Configuration:Preferences:Increase Font Size"
    }, {
        label: "Decrease Font Size",
        command: "Configuration:Preferences:Decrease Font Size"
    }, {
        label: "Toggle Show Gutter",
        command: "Configuration:Preferences:Toggle Show Gutter"
    }, {
        label: "Toggle Show Invisibles",
        command: "Configuration:Preferences:Toggle Show Invisibles"
    }, {
        label: "Toggle Show Print Margin",
        command: "Configuration:Preferences:Toggle Show Print Margin"
    }, {
        label: "Toggle Word Wrap",
        command: "Configuration:Preferences:Toggle Word Wrap"
    }, {
        label: "Toggle Persistent Tree",
        command: "Configuration:Preferences:Toggle Persistent Tree"
    }, {
        label: "Toggle Menus",
        command: "Configuration:Preferences:Toggle Menus"
    }, {
        label: "Toggle Native Scroll Bars",
        command: "Configuration:Preferences:Toggle Native Scroll Bars"
    }, {
        label: "KeyBinding",
        submenu: [{
            label: "Zed",
            command: "Configuration:Preferences:KeyBinding:Zed"
        }, {
            label: "Emacs",
            command: "Configuration:Preferences:KeyBinding:Emacs"
        }, {
            label: "Vim",
            command: "Configuration:Preferences:KeyBinding:Vim"
        }]
    }, {
        label: "Reload",
        command: "Configuration:Reload"
    }]
}, {
    label: "Window",
    submenu: [{
        label: "New",
        command: "Window:New"
    }, {
        label: "Reload",
        command: "Window:Reload"
    }, {
        label: "List",
        command: "Window:List"
    }, {
        type: 'separator'
    }, {
        label: "Close",
        command: "Window:Close"
    }, {
        label: "Maximize",
        command: "Window:Maximize"
    }, {
        label: "Full Screen",
        command: "Window:Fullscreen"
    }, {
        label: "Minimize",
        command: "Window:Minimize"
    }]
}, {
    label: "Help",
    submenu: [{
        label: "Introduction",
        command: "Help:Intro"
    }, {
        label: "Command Reference",
        command: "Help:Commands"
    }]
}];
//# sourceMappingURL=template.js.map