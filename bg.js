/* global tcy:true, u:true, b:true, console:true */

(function(doc) {

    var root = this;

    var bg = {};

    root.bg = bg;

    var allowClickProcessing = true,
        clickCount = 0;

    var clickTimer, iconTimer, notificationTimer;

    var s = tcy.s;

    var CB_BUFFER = doc.getElementById('b');

    var LINE_BREAK = (function() {
        var winRe = /win(dows|[\s]?(nt|me|ce|xp|vista|[\d]+))/i;

        return winRe.test(navigator.appVersion || '') ||
            winRe.test(navigator.platform || '') ||
            (navigator.userAgent || '').indexOf('Windows') !== -1 ? '\r\n' : '\n';
    }());

    function clicksToRange(clicks) {
        return clicks; // clicks and range happen to coincide. function kept for clarity.
    }

    // get an arr of tabs from the browser, filtered accordingly
    // returned arr may have falsy gaps
    function getTabs(range, currentWid, cb) {
        var q = {};

        if ((range === tcy.TAB_RANGE.WINDOW || range === tcy.TAB_RANGE.ALL) && s.get('ignore-pinned-tabs') === 'true') {
            q.pinned = false;
        }

        if (range === tcy.TAB_RANGE.SELECTED || range === tcy.TAB_RANGE.WINDOW) {
            q.windowId = currentWid;
        }

        if (range === tcy.TAB_RANGE.SELECTED) {
            q.highlighted = true;
        }

        b.queryTabs(q, cb);
    }

    function copyTabs(tabs, range, prefix, cb) {
        var format = s.get(prefix + '-copy-format');

        tcy.tabsText(tabs, format, tcy.formatOptions(prefix, format), function(str, tabCount, html) {
            if (tabCount) {
                copyToClipboard(str, html, function(ok) {
                    notify(ok, range, tabCount, tcy.formatNameCustomized(prefix));
                    cb();
                });
            } else {
                notify(false, range, 0, tcy.formatNameCustomized(prefix));
                cb();
            }
        });
    }

    function copyToClipboard(txt, html, cb) {
        if (txt.length) {
            CB_BUFFER.value = txt;
            CB_BUFFER.select();

            var oncopy = doc.oncopy;

            doc.oncopy = function(e) {
                e.preventDefault();

                e.clipboardData.setData('text/plain', txt.replace(/(?:\r\n|\r|\n)/g, LINE_BREAK));

                if (html) {
                    e.clipboardData.setData('text/html', html);
                }

                cb(true);
            };

            try {
                if (!doc.execCommand('copy')) {
                    cb(false);
                }
            } catch (ex) {
                cb(false);
            }

            doc.oncopy = oncopy;
        }
    }

    function notify(ok, range, tabCount, formatNameCustomized) {
        switch (s.get('copy-notification')) {

            case 'both':

                var both = true;

                /* falls through */
            case 'toaster':

                b.permissionsContains({
                    permissions: ['notifications']
                }, function(result) {
                    if (result) {
                        // TabCopy has notifications permission

                        clearTimeout(notificationTimer);

                        b.clearNotification('copy-ok');

                        b.createNotification('copy-ok', {
                            type: 'basic',
                            iconUrl: notifyImagePath(range, ok),
                            title: tcy.countLabel(ok ? tabCount : 0, range, 'Copied'),
                            // todo: consider alternate title if not ok (eg, "FAILED to copy n tabs in window")
                            message: tabCount ? 'as ' + formatNameCustomized : ''
                        }, function(notificationId) {
                            notificationTimer = setTimeout(function() {
                                b.clearNotification(notificationId);
                            }, 2000);
                        });
                    } else {
                        console.warn('Cannot create browser notification. User opt-in required.');
                    }
                });

                if (!both) {
                    break;
                }

                /* falls through */
            case 'badge':

                b.showButtonBadge(ok ? tabCount + '' : '!', bgColor(range, ok));
                b.setButtonIcon(iconPath(range, ok));

                clearTimeout(iconTimer);
                iconTimer = setTimeout(function() {
                    b.hideButtonBadge();
                    b.setButtonIcon('img/icon19.png');
                }, 800);
        }

        // keep these as hex for cross-browser compat
        function bgColor(range, ok) {
            if (!ok) {
                return '#F00';
            }

            switch (range) {
                case tcy.TAB_RANGE.SELECTED:
                    // return '#00B300';
                case tcy.TAB_RANGE.ALL:
                    // return '#000';
                case tcy.TAB_RANGE.WINDOW:
                    // return '#668FFF';
                    // return '#0F9BFF';
                    return '#000';
            }
        }

        function iconPath(range, ok) {
            if (!ok) {
                return 'img/icon19_fail.png';
            }

            switch (range) {
                case tcy.TAB_RANGE.SELECTED:
                    // return 'img/icon19green.png';
                case tcy.TAB_RANGE.ALL:
                    // return 'img/icon19black.png';
                case tcy.TAB_RANGE.WINDOW:
                    // return 'img/icon19blue.png';
                    return 'img/icon19_ok.png';
            }
        }

        function notifyImagePath(range, ok) {
            if (!ok) {
                return 'img/notify_fail.png';
            }

            switch (range) {
                case tcy.TAB_RANGE.SELECTED:
                    // return 'img/notifyGreen.png';
                case tcy.TAB_RANGE.ALL:
                    // return 'img/notifyBlack.png';
                case tcy.TAB_RANGE.WINDOW:
                    // return 'img/notifyBlue.png';
                    return 'img/notify_ok.png';
            }
        }
    }


    // PREP STORE

    // in future releases, we'll check store version for falsy (new install) and againt manifest version (potential upgrade) for install/upgrade actions.

    if (!s.get('version')) { // new install or update from v2.5
        if (localStorage.getItem('custom-start') != null) { // upgrade from v2.5
            // existing users default to simple (legacy) mode
            s.set('mode', 'simple');
            s.set('show-upgrade-message', 'true');
            b.openOptions();
        }

        // provide suggested value(s) if none specified
        u.each(tcy.FORMAT_PREFIXES, function(prefix) {
            if (localStorage.getItem(prefix + '-custom-start') == null) {
                s.set(prefix + '-custom-start', '[date][n][n]');
            }

            if (localStorage.getItem(prefix + '-custom-tab') == null) {
                s.set(prefix + '-custom-tab', '[#]) Title: [title][n]   URL:   [url]');
            }

            if (localStorage.getItem(prefix + '-custom-delimiter') == null) {
                s.set(prefix + '-custom-delimiter', '[n][n]');
            }
        });

        s.set('version', b.getExtensionVersion());
    }

    // handler doesn't get called on click if a popup is specified, so this is only relevant for simple mode
    b.onButtonClicked(function(tab) {
        processCopy(tab.windowId, 'simple');
    });

    b.onCommand(function(command) {
        if (command === 'copy-tabs') {
            processCopy(b.WINDOW_ID_CURRENT);
        }
    });

    function processCopy(windowId, mode) {
        if (allowClickProcessing) {

            clickCount++;

            clearTimeout(clickTimer);

            clickTimer = setTimeout(
                function(windowId, range, prefix) {
                    bg.getAndCopyTabs(windowId, range, prefix);
                }, clickCount > 2 ? 0 : 300, windowId, clicksToRange(clickCount), mode === 'simple' || s.get('mode') === 'simple' ? 'simple' : s.get('selected-prefix'));
        }
    }

    // API

    bg.getAndCopyTabs = function(currentWid, range, prefix) {
        // console.log(range);
        if (allowClickProcessing) {
            allowClickProcessing = false;

            getTabs(range, currentWid, function(tabs) {
                copyTabs(tabs, range, prefix, function() {
                    allowClickProcessing = true;
                    clickCount = 0;
                });
            });
        }
    };

    bg.setContextMenu = function(mode) {
        b.removeContextMenus(function() {
            if (s.get('show-in-context-menu') === 'true') {
                mode = mode || s.get('mode');

                if (mode === 'simple') {
                    addContextMenuActionItem('Copy tab', 'simple');
                } else {
                    var fancy1CopyFormat = s.get('fancy-1-copy-format'),
                        fancy2CopyFormat = s.get('fancy-2-copy-format');

                    if (fancy1CopyFormat === 'none' && fancy2CopyFormat === 'none') {
                        addContextMenuActionItem('Copy tab', 'fancy-0');
                    } else {
                        // create top context menu entry
                        b.createContextMenu({
                            id: 'top',
                            title: 'Copy tab as'
                        }, function() {
                            addContextMenuActionItem(tcy.formatNameCustomized('fancy-0'), 'fancy-0', 'top');

                            if (fancy1CopyFormat !== 'none') {
                                addContextMenuActionItem(tcy.formatNameCustomized('fancy-1'), 'fancy-1', 'top');
                            }

                            if (fancy2CopyFormat !== 'none') {
                                addContextMenuActionItem(tcy.formatNameCustomized('fancy-2'), 'fancy-2', 'top');
                            }
                        });
                    }
                }
            }
        });

        function addContextMenuActionItem(title, prefix, pid) {
            var properties = {
                id: prefix + '-copy-format',
                title: title,
                onclick: function(info, tab) {
                    if (allowClickProcessing) {
                        allowClickProcessing = false;

                        copyTabs(
                            /*info.linkUrl ? [{
                                            url: info.linkUrl
                                        }] :*/
                            [tab], 1, prefix,
                            function() {
                                allowClickProcessing = true;
                                clickCount = 0;
                            });
                    }
                }
            };

            if (pid) { // firefox doesn't allow setting undefined pid, so check before attaching it
                properties.parentId = pid;
            }

            b.createContextMenu(properties);
        }
    };

    (function init(mode) {
        tcy.setPopupAndTitle(mode);
        bg.setContextMenu(mode);
    }(s.get('mode')));

}).call(this, document);
