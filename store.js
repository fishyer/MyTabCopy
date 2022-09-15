(function(win) {
    var store;

    win.Store = function(keyAliases, valAliases, def) {
        // enforce singleton
        if (store) {
            return store;
        }

        store = {};

        function translate(val, key) {
            var aliases = valAliases[key];

            if (!aliases) {
                return val;
            }

            return aliases[val] || val;
        }

        store.get = function(key) {
            var val = localStorage.getItem(key);

            if (val) {
                return translate(val, key);
            }

            var aliases = keyAliases[key];

            if (aliases) {
                for (var i = aliases.length; i--;) {
                    if ((val = localStorage.getItem(aliases[i]))) {
                        return translate(val, key);
                    }
                }
            }

            return def(key);
        };

        store.set = function(key, val) {
            var aliases = keyAliases[key];

            if (aliases) {
                for (var i = aliases.length; i--;) {
                    localStorage.removeItem(aliases[i]);
                }
            }

            if (val !== localStorage.getItem(key)) {
                localStorage.setItem(key, val);
                return true;
            }
        };

        return store;
    };
}(window));
