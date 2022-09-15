(function(undefined) {

    var root = this;

    var u = {};

    var origU = root.u;

    root.u = u;

    u.trimEnd = function(str, char) {
        if (str) {
            if (str[str.length - 1] === char) {
                return str.substr(0, str.length - 1);
            }

            return str;
        }

        return '';
    };

    u.trimStart = function(str, char) {
        if (str) {
            if (str[0] === char) {
                return str.substr(1);
            }

            return str;
        }

        return '';
    };

    u.endsWith = function(str, sub) {
        str = str == null ? '' : str + '';
        sub = sub + '';

        var i = str.length - sub.length;

        return i >= 0 && str.indexOf(sub, i) === i;
    };

    u.each = function(arr, f) {
        for (var i = 0; i < arr.length; i++) {
            if (f(arr[i]) === false) {
                return false;
            }
        }
    };

    u.noConflict = function() {
        root.u = origU;
        return this;
    };

    // limitations (non-prohibitive in our case) of current implementation:
    // - dependent on DOM
    // - no querystring parsing
    // - partial urls are normalized to the protocol/domain of the page
    u.parseUrl = function(str) {
        var r = {};

        var url = document.createElement('a');
        url.href = str;

        r.protocol = u.trimEnd(url.protocol, ':');
        r.host = url.host; // includes port (if non-standard)
        r.pathname = u.trimStart(url.pathname, '/');
        r.search = u.trimStart(url.search, '?');
        r.hash = u.trimStart(url.hash, '#');

        return r;
    };

    u.titleCase = function(str) {
        if (str) {
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }
    };

    u.insertAtCaret = function(el, str) {
        var scrollPos = el.scrollTop,
            strPos = el.selectionStart;

        el.value = el.value.substring(0, strPos) + str + el.value.substring(el.selectionEnd, el.value.length);
        strPos = strPos + str.length;
        el.selectionStart = strPos;
        el.selectionEnd = strPos;
        el.focus();
        el.scrollTop = scrollPos;
    };

    u.escapeHTML = function(txt) {
        return String(txt)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/ /g, '&nbsp;');
    };

}).call(this);
