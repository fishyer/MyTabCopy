/* global u:true, Store:true, b:true */

(function(undefined) {

    var root = this;

    var tcy = {};

    root.tcy = tcy;

    // allows updating of store key names across app versions
    // <canonical key>: [ <key aliases> ]
    var KEY_ALIASES = {
        'simple-copy-format': ['tab-format', 'format'],
        'simple-compact-separator': ['tab-format-delimiter', 'condensed-separator'],
        'simple-html-table-include-header': ['html-table-include-header'],
        'simple-custom-tab': ['tab-format-template', 'custom-tab-template'],
        'simple-custom-start': ['custom-start'],
        'simple-custom-end': ['custom-end'],
        'simple-custom-delimiter': ['custom-delimiter']
    };

    // allows updating of store values across app versions
    // <key>: { <translations for values of key> }
    var VAL_ALIASES = {
        'simple-copy-format': {
            'txt1Line': 'compact',
            'condensed': 'compact',
            'txt2Lines': 'expanded',
            'txtUrlOnly': 'url'
        }
    };

    // scope of copy enum
    tcy.TAB_RANGE = {
        SELECTED: 1,
        WINDOW: 2,
        ALL: 3
    };

    // used for store keys and html element ids of format items
    tcy.FORMAT_PREFIXES = ['simple', 'fancy-0', 'fancy-1', 'fancy-2'];

    // todo: define these using hardcoded custom options instead?
    function tabText(tab, format, formatOptions, seq) {

        switch (format) {

            case 'expanded':

                return (tab.title && tab.title.trim() ? tab.title + '\n' : '') + tab.url;

            case 'compact':

                return (tab.title && tab.title.trim() ? tab.title + formatOptions.compactSeparator : '') + tab.url;

            case 'url':

                return tab.url;

            case 'title':

                return tab.title && tab.title.trim() ? tab.title : tab.url;

            case 'csv':

                return '"' + (tab.title && tab.title.trim() ? tab.title : tab.url).replace('"', '\\"') + '","' + tab.url.replace('"', '\\"') + '"';

            case 'json':

                return '{' + (tab.hasOwnProperty('title') ? '\n   "title": "' + tab.title + '",' : '') + '\n   "url": "' + tab.url + '" \n}';

            case 'markdown':

                return '[' + (tab.title && tab.title.trim() ? tab.title : tab.url) + '](' + tab.url + ')';

            case 'bbcode':

                if (tab.title && tab.title.trim()) {
                    return '[url=' + tab.url + ']' + tab.title + '[/url]';
                }

                return '[url]' + tab.url + '[/url]';

            case 'html':
            case 'link_html':

                // return '<a href="' + tab.url + '" target="_blank">' + (tab.title && tab.title.trim() ? tab.title : tab.url) + '</a>';

                return '<a href="' + tab.url + '">' + (tab.title && tab.title.trim() ? tab.title : tab.url) + '</a>';

            case 'html-table':

                return '      <tr>\n         <td>' + (tab.title && tab.title.trim() ? tab.title : tab.url) + '</td>\n         <td>' + tab.url + '</td>\n      </tr>';

            case 'custom_html':

                return interpolate(u.escapeHTML(formatOptions.customTab), true, new Date(), tab, seq);

            case 'custom':

                return interpolate(formatOptions.customTab, false, new Date(), tab, seq);

        }
    }

    function tabDelimiter(format, customDelimiter) {

        switch (format) {

            case 'expanded':

                return '\n\n';

            case 'title':

                return '\n';

            case 'html':

                return '<br>\n';

            case 'link_html':

                return '<br>';

            case 'csv':

                return '\n';

            case 'json':

                return ',\n';

            case 'custom_html':

                return interpolate(u.escapeHTML(customDelimiter), true);

            case 'custom':

                return interpolate(customDelimiter);

        }

        return '\n';
    }

    function currentTime(now) {
        var zeroFill = function(value) {
            if (value < 10) {
                value = '0' + value
            }
            return value
        }
        var year = now.getFullYear();
        //年
        var month = zeroFill(now.getMonth() + 1);
        //月
        var day = zeroFill(now.getDate());
        //日
        var hh = zeroFill(now.getHours());
        //时
        var mm = zeroFill(now.getMinutes());
        //分
        var ss = zeroFill(now.getSeconds());
        return (`${year}-${month}-${day} ${hh}:${mm}:${ss}`);
    }

    function interpolate(str, isHtml, d, tab, seq, count, formatName) {
        var linebreak, tabchar;

        if (isHtml) {
            linebreak = '<br>';
            tabchar = '&#9;';
        } else {
            linebreak = '\n';
            tabchar = '\t';
        }

        // non-prinatbles

        var r = str.replace(/\\n/g, linebreak).replace(/\\t/g, tabchar).replace(/\[\s*(?:newline|n)\s*\]/ig, linebreak).replace(/\[\s*(?:tab|t)\s*\]/ig, tabchar);

        // datetime

        if (d) {
            r = r.replace(/\[\s*time\s*\]/ig, d.toLocaleTimeString()).replace(/\[\s*date\s*\]/ig, d.toLocaleDateString()).replace(/\[\s*date[ +-]?time\s*\]/ig, currentTime(d));
        }

        // tab

        if (tab) {
            var title = tab.hasOwnProperty('title') ? tab.title : tab.url;

            r = r.replace(/\[\s*title\s*\]/ig, title).replace(/\[\s*url\s*\]/ig, tab.url);

            // url parts

            if (/\[schema|protocol|host|path|query|hash\]/.test(str)) {
                var url = u.parseUrl(tab.url);

                r = r.replace(/\[\s*schema\s*\]/ig, url.protocol);
                r = r.replace(/\[\s*protocol\s*\]/ig, url.protocol);
                r = r.replace(/\[\s*host\s*\]/ig, url.host);
                r = r.replace(/\[\s*path\s*\]/ig, url.pathname);
                r = r.replace(/\[\s*query\s*\]/ig, url.search);
                r = r.replace(/\[\s*hash\s*\]/ig, url.hash);
            }

            r = r.replace(/\[\s*link\s*\]/ig, isHtml ? ('<a href="' + tab.url + '">' + title + '</a>') : title);
        }

        // tab sequence

        if (seq) {
            r = r.replace(/\[\s*(?:tab)?[ +-]?(?:#|number)\s*\]/ig, seq);
        }

        // tab count

        if (count != null) {
            r = r.replace(/\[\s*count\s*\]/ig, count);
        }

        // custom name

        if (formatName) {
            r = r.replace(/\[\s*format[ +-]?name\s*\]/ig, formatName);
        }

        return r;
    }

    function wrap(str, format, formatOptions, count) {

        switch (format) {

            case 'csv':

                return 'Title,URL\n' + str;

            case 'json':

                return '[' + str + ']';

            case 'html-table':

                return '<table>' + (formatOptions.htmlTableIncludeHeader === 'true' ? '\n   <thead>\n      <tr>\n         <th>Title</th>\n         <th>URL</th>\n      </tr>\n   </thead>' : '') + '\n   <tbody>\n' + str + '\n   </tbody>\n</table>';

            case 'custom_html':

                return interpolateWrap(str, formatOptions.customStart, formatOptions.customEnd, new Date(), count, formatOptions.customName, true);

            case 'custom':

                return interpolateWrap(str, formatOptions.customStart, formatOptions.customEnd, new Date(), count, formatOptions.customName);

        }

        return str;
    }

    function interpolateWrap(str, start, end, d, count, name, isHtml) {
        if (isHtml) {
            // normalize tokens (to eliminate spaces), since they'll be escaped below
            start = start.replace(/\[\s*format[ +-]?name\s*\]/ig, '[formatname]');
            end = end.replace(/\[\s*format[ +-]?name\s*\]/ig, '[formatname]');

            start = u.escapeHTML(start);
            end = u.escapeHTML(end);
            name = u.escapeHTML(name);
        }


        return interpolate(start, isHtml, d, null, null, count, name) + str + interpolate(end, isHtml, d, null, null, count, name);
    }

    var s = tcy.s = Store(KEY_ALIASES, VAL_ALIASES, function def(key) {
        var r;

        if (key === 'mode') {
            return 'fancy';
        }

        if (key === 'fancy-1-copy-format') {
            return 'compact';
        }

        if (key === 'fancy-2-copy-format') {
            return 'link';
        }

        if (key === 'copy-notification') {
            return 'badge';
        }

        if (key === 'show-in-context-menu') {
            return 'true';
        }

        if (key === 'selected-prefix') {
            return 'fancy-0';
        }

        u.each(tcy.FORMAT_PREFIXES, function(prefix) {
            return u.each(['copy-format', 'compact-separator', 'html-table-include-header', 'custom-tab', 'custom-name', 'custom-start', 'custom-end', 'custom-delimiter'], function(postfix) {
                if (key === prefix + '-' + postfix) {
                    r = tcy.postfixDef(postfix);
                    return false;
                }
            });
        });

        return r;
    });

    tcy.tabsText = function(tabs, format, formatOptions, cb) {
        if (format === 'link') {
            tcy.tabsText(tabs, 'title', null, function(text) {
                tcy.tabsText(tabs, 'link_html', null, function(html, tabCount) {
                    cb(text, tabCount, html);
                });
            });
        } else {
            var str = '',
                tabCount = 0;

            if (!format || format === 'none') {
                return cb(str, tabCount);
            }

            var appendTab = (function(delimiter, format) {
                return function(str, tab) {
                    if (tab) {
                        if (str.length) {
                            str += delimiter;
                        }

                        str += tabText(tab, format, formatOptions, ++tabCount);
                    }

                    return str;
                };
            }(tabDelimiter(format, formatOptions && formatOptions.customDelimiter), format));

            for (var i = 0; i < tabs.length; i++) {
                str = appendTab(str, tabs[i]);
            }

            if (format === 'custom' && /\[\s*link\s*\]/.test(formatOptions.customTab)) {
                tcy.tabsText(tabs, 'custom_html', formatOptions, function(html) {
                    cb(wrap(str, format, formatOptions, tabCount), tabCount, html);
                });
            } else {
                cb(wrap(str, format, formatOptions, tabCount), tabCount);
            }
        }
    };

    tcy.postfixDef = function(postfix) {
        switch (postfix) {
            case 'copy-format':
                return 'expanded';
            case 'compact-separator':
                return ': ';
            case 'custom-name':
                return 'My format';
        }

        return '';
    };

    tcy.formatOptions = function(prefix, format) {
        format = format || s.get(prefix + '-copy-format');

        if (format === 'compact') {
            return {
                compactSeparator: s.get(prefix + '-compact-separator')
            };
        } else if (format === 'html-table') {
            return {
                htmlTableIncludeHeader: s.get(prefix + '-html-table-include-header')
            };
        } else if (format === 'custom') {
            return {
                customTab: s.get(prefix + '-custom-tab'),
                customName: s.get(prefix + '-custom-name'),
                customStart: s.get(prefix + '-custom-start'),
                customEnd: s.get(prefix + '-custom-end'),
                customDelimiter: s.get(prefix + '-custom-delimiter')
            };
        }
    };

    tcy.formatName = function(format) {
        switch (format) {
            case 'compact':
            case 'expanded':
            case 'link':
            case 'markdown':
            case 'custom':

                return u.titleCase(format);

            case 'url':
            case 'csv':
            case 'json':
            case 'html':

                return format.toUpperCase(format);

            case 'bbcode':

                return 'BB code';

            case 'html-table':

                return 'HTML table';

            case 'none':

                return 'None';

        }
    };

    tcy.formatNameCustomized = function(prefix) {
        var format = s.get(prefix + '-copy-format');

        if (format === 'custom') {
            return s.get(prefix + '-custom-name');
        }

        return tcy.formatName(format);
    };

    tcy.countLabel = function(count, range, prefix) {
        if (prefix) {
            prefix = prefix.trim() + ' ';
        } else {
            prefix = '';
        }

        switch (range) {

            case tcy.TAB_RANGE.SELECTED:

                if (count === 1) {
                    return prefix + (prefix ? 's' : 'S') + 'elected tab';
                }

                return prefix + count + ' selected tabs';

            case tcy.TAB_RANGE.WINDOW:

                return prefix + count + (count === 1 ? ' tab' : ' tabs') + ' in window';

            case tcy.TAB_RANGE.ALL:

                //1// if (count > 1) {
                //1//     return prefix + (prefix ? 'a' : 'A') + 'll ' + count + ' tabs';
                //1// }

                //1// return prefix + (prefix ? 'a' : 'A') + 'll tabs';

                //2// return prefix + count + (count === 1 ? ' tab' : ' tabs') + ' overall'; 

                return prefix + 'all of ' + count + (count === 1 ? ' tab' : ' tabs');
        }

        return prefix + count + (count === 1 ? ' tab' : ' tabs');
    };

    tcy.setPopupAndTitle = function(mode) {
        if (mode === 'simple') {
            b.removeButtonPopup();
            b.setButtonTooltip('Single click:\tcopy selected tab\nDouble click:\tcopy tabs in this window\nTriple click:\tcopy all tabs');
        } else {
            b.setButtonPopup('popup.html');
            b.setButtonTooltip('TabCopy'); // 2015-12-16 apparently there is no reliable way to suppress the browser_action tooltip. Setting it to '' yields the name of the extension. Setting it to ' ' suppresses it on Windows but shows tooltip with a space in it on OS X. Explicitly setting it to 'TabCopy' for clarity.
        }
    };

}).call(this);
