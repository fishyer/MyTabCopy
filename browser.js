/* global chrome:true */

// CHROME Browser API

(function(undefined) {

    var root = this;

    var b = {};

    root.b = b;

    b.BROWSER = 'chrome';

    b.WINDOW_ID_CURRENT = chrome.windows.WINDOW_ID_CURRENT;

    // WOTS

    b.queryTabs = function(q, cb) {
        chrome.tabs.query(q, cb);
    };

    b.getCurrentWindow = function(cb) {
        chrome.windows.getCurrent(cb);
    };

    b.activateTab = function(id) {
        chrome.tabs.update(id, {
            active: true
        });
    };

    b.openTab = function(url, opts) {
        opts = opts || {};

        opts.url = url;

        chrome.tabs.create(opts);
    };

    b.openOrActivateTab = function(url) {
        b.queryTabs({
            currentWindow: true,
            status: 'complete',
            url: url
        }, function(tabs) {
            if (tabs.length) {
                b.activateTab(tabs[0].id);
                return;
            }

            b.openTab(url, {
                active: true
            });
        });
    };

    b.onTabOpen = function(handler) {
        chrome.tabs.onCreated.addListener(handler);
    };

    b.onTabClose = function(handler) {
        chrome.tabs.onRemoved.addListener(handler);
    };

    b.onTabPinned = function(handler) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.pinned === true) {
                handler(tabId, tab);
            }
        });
    };

    b.onTabUnpinned = function(handler) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.pinned === false) {
                handler(tabId, tab);
            }
        });
    };

    b.onTabHighlighted = function(handler) {
        chrome.tabs.onHighlighted.addListener(handler);
    };

    b.onTabMoved = function(handler) {
        chrome.tabs.onAttached.addListener(handler);
    };

    // BROWSER ACTION BUTTON

    b.setButtonTooltip = function(title) {
        chrome.browserAction.setTitle({
            title: title
        });
    };

    b.setButtonIcon = function(path) {
        chrome.browserAction.setIcon({
            path: path
        });
    };

    b.setButtonPopup = function(path) {
        chrome.browserAction.setPopup({
            popup: path
        });
    };

    b.removeButtonPopup = function() {
        chrome.browserAction.setPopup({
            popup: ''
        });
    };

    // text is required. color is optional.
    b.showButtonBadge = function(text, color) {
        if (!text) {
            return;
        }

        chrome.browserAction.setBadgeText({
            text: text
        });

        if (color) {
            chrome.browserAction.setBadgeBackgroundColor({
                color: color
            });
        }
    };

    b.hideButtonBadge = function() {
        chrome.browserAction.setBadgeText({
            text: ''
        });
    };

    b.onButtonClicked = function(handler) {
        chrome.browserAction.onClicked.addListener(handler);
    };

    // COMMANDS

    b.getAllCommands = function(cb) {
        chrome.commands.getAll(cb);
    };

    b.onCommand = function(handler) {
        chrome.commands.onCommand.addListener(handler);
    };

    b.keyboardShortcutsUrl = function() {
        return 'chrome://extensions/configureCommands';
    };

    // CONTEXT MENU

    b.createContextMenu = function(properties, cb) {
        properties.contexts = ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']; // show everywhere except in 'browser_action', 'page_action' menus

        chrome.contextMenus.create(properties, cb);
    };

    b.removeContextMenus = function(cb) {
        chrome.contextMenus.removeAll(cb);
    };

    // NOTIFICATION

    b.createNotification = function(id, options, cb) {
        chrome.notifications.create(id, options, cb);
    };

    b.clearNotification = function(id) {
        chrome.notifications.clear(id);
    };

    // EXTENSION

    b.getExtensionVersion = function() {
        return chrome.runtime.getManifest().version;
    };

    b.getBackgroundAPI = function() {
        return chrome.extension.getBackgroundPage().bg;
    };

    b.openOptions = function(cb) {
        chrome.runtime.openOptionsPage(cb);
    };

    // PUBLIC PROFILE

    b.extensionFeedbackUrl = function() {
        return 'https://chrome.google.com/webstore/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb/support';
    };

    // PERMISSIONS

    b.permissionsContains = function(perms, cb) {
        chrome.permissions.contains(perms, cb);
    };

    b.permissionsRequest = function(perms, cb) {
        chrome.permissions.request(perms, cb);
    };

    b.permissionsRemove = function(perms, cb) {
        chrome.permissions.remove(perms, cb);
    };

}).call(this);
