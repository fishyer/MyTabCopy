/* global u:true, tcy:true, b:true */

// code assumes that form element ids are consistent with keys of store items they are backed by

(function(doc) {
	var KEYCODE_ESC = 27;

	var TAB_WIDTH_PX = 400;

	var SAMPLE = [{
		title: 'Example 1',
		url: 'https://www.example.com/'
	}, {
		title: 'Example 2',
		url: 'http://example.com/search?q=kittens'
	}, {
		title: 'Example 3',
		url: 'http://example.com/folder/doc.html#fragment'
	}];

	var bg = b.getBackgroundAPI();

	var tabSimpleMode = doc.getElementById('tab-simple-mode'),
		tabFancyMode = doc.getElementById('tab-fancy-mode'),
		tabIndicator = doc.getElementById('tab-indicator');

	var s = tcy.s;

	addControlStateListeners();

	u.each(tcy.FORMAT_PREFIXES, addFormatOptionsEditListeners);

	addLegendListeners();

	addMiscListeners();

	initControlValues();

	setControlStates();

	if (b.BROWSER === 'safari') {
		// 2015-12-17 safari api doesn't expose pinned tabs yet
		var els = doc.getElementsByClassName('option-ignore-pinned-tabs');

		for (var i = els.length; i--;) {
			els[i].style.display = 'none';
		}
	}

	doc.body.style.display = '';

	if (s.get('show-upgrade-message')) { // update from v2.5
		setTimeout(function() {
			var el = doc.getElementById('user-message');
			el.style.height = '200px';
		}, 800);

		localStorage.removeItem('show-upgrade-message');
	}

	function addControlStateListeners() {
		u.each(['simple', 'fancy'], function(mode) {
			doc.getElementById('tab-' + mode + '-mode').addEventListener('click', function() {
				selectedTab(mode);
				tcy.setPopupAndTitle(mode);
				bg.setContextMenu(mode);
				s.set('mode', mode);
				s.set('selected-prefix', '');
				setControlStates();
			});
		});

		doc.getElementById('copy-notification').addEventListener('change', function() {
			var that = this;

			if (this.value === 'toaster' || this.value === 'both') {
				b.permissionsRequest({
					permissions: ['notifications']
				}, function(granted) {
					if (granted) {
						s.set(that.id, that.value);
					} else {
						that.value = s.get(that.id);
					}
				});
			} else {
				b.permissionsRemove({
					permissions: ['notifications']
				});

				s.set(this.id, this.value);
			}
		});

		doc.getElementById('ignore-pinned-tabs').addEventListener('change', function() {
			s.set(this.id, this.checked);
		});

		doc.getElementById('show-in-context-menu').addEventListener('change', function() {
			s.set(this.id, this.checked);
			bg.setContextMenu();
			setControlStates();
		});

		u.each(tcy.FORMAT_PREFIXES, addFormatOptionsListeners);

		window.addEventListener('storage', function(e) {
			if (e.key === 'mode') {
				selectedTab(e.newValue);
				setControlStates();
			} else if (e.key === 'copy-notification') {
				doc.getElementById('copy-notification').value = e.newValue;
			} else if (e.key === 'ignore-pinned-tabs' || e.key === 'show-in-context-menu') {
				doc.getElementById(e.key).checked = e.newValue === 'true';
			}
		});

	}

	function addFormatOptionsListeners(prefix) {
		function setValue() {
			if (s.set(this.id, this.value)) {
				setControlStates(prefix);
			}
		}

		// selects

		doc.getElementById(prefix + '-copy-format').addEventListener('change', function() {
			s.set('selected-prefix', '');
			setValue.call(this);
			bg.setContextMenu();
		});

		// checkboxes

		doc.getElementById(prefix + '-html-table-include-header').addEventListener('change', function() {
			if (s.set(this.id, this.checked)) {
				setControlStates();
			}
		});

		// text fields

		u.each(['-compact-separator', '-custom-tab', '-custom-start', '-custom-end', '-custom-delimiter'], function(postfix) {
			doc.getElementById(prefix + postfix).addEventListener('keyup', setValue);
		});

		doc.getElementById(prefix + '-custom-name').addEventListener('keyup', function() {
			setValue.call(this);
			bg.setContextMenu();
		});

		window.addEventListener('storage', function(e) {
			if (e.key === prefix + '-html-table-include-header') {
				doc.getElementById(e.key).checked = e.newValue === 'true';
			} else {
				u.each(['-compact-separator', '-custom-tab', '-custom-start', '-custom-end', '-custom-delimiter', '-copy-format', '-custom-name'], function(postfix) {
					if (e.key === prefix + postfix) {
						doc.getElementById(e.key).value = e.newValue;
					}
				});
			}

			setControlStates(prefix);
		});
	}

	function addFormatOptionsEditListeners(prefix) {
		u.each(['compact-separator', 'custom-name'], function(postfix) {
			doc.getElementById(prefix + '-' + postfix).addEventListener('change', function() {
				if (!this.value) {
					this.value = tcy.postfixDef(postfix);
				}
			});
		});
	}

	function addLegendListeners() {
		u.each(doc.getElementsByClassName('toggle-legend'), function(el) {
			el.addEventListener('click', function() {
				closeAllLegends(el);
				el.nextElementSibling.classList.remove('legend-open-top');

				el.classList.toggle('toggle-legend-open');

				// if (el.nextElementSibling.getBoundingClientRect().bottom + 10 > doc.getElementById('options-box').getBoundingClientRect().bottom) {
				if (el.nextElementSibling.getBoundingClientRect().bottom > doc.documentElement.clientHeight) {
					el.nextElementSibling.classList.add('legend-open-top');
				}
			});
		});

		// u.each(doc.getElementsByClassName('close-legend'), function(el) {
		// 	el.addEventListener('click', closeAllLegends);
		// });

		u.each(doc.getElementsByClassName('legend'), function(el) {
			el.addEventListener('click', function(e) {
				e.stopPropagation();
			});
		});

		u.each(doc.getElementsByClassName('token'), function(el) {
			el.addEventListener('click', function() {
				var input = el.parentElement.parentElement.parentElement.parentElement.previousElementSibling;

				u.insertAtCaret(input, el.textContent);
				s.set(input.id, input.value);
				setControlStates();
			});
		});

		u.each(doc.getElementsByTagName('input'), function(el) {
			el.addEventListener('focus', function() {
				closeAllLegends(el.nextElementSibling && el.nextElementSibling.children[0]);
			});
		});

		doc.addEventListener('click', function(e) {
			if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
				closeAllLegends();
			}
		});

		doc.addEventListener('keydown', function(e) {
			if (e.keyCode === KEYCODE_ESC) {
				closeAllLegends();
			}
		});
	}

	function addMiscListeners() {
		doc.getElementById('btn-contribute').addEventListener('click', function() {
			b.openOrActivateTab('http://tabcopy.com/contribute/');
		});

		doc.getElementById('btn-feedback').addEventListener('click', function() {
			b.openOrActivateTab(b.extensionFeedbackUrl());
		});

		doc.getElementById('close-user-message').addEventListener('click', function() {
			var el = doc.getElementById('user-message');
			el.style.height = '';
		});

		doc.getElementById('shortcut-key').addEventListener('click', function() {
			b.openOrActivateTab(b.keyboardShortcutsUrl());
		});
	}

	function closeAllLegends(exceptEl) {
		if (exceptEl) {
			setTimeout(function() {
				exceptEl.parentElement.parentElement.children[1].focus();
			}, 0);
		}

		u.each(doc.getElementsByClassName('toggle-legend'), function(el) {
			if (!exceptEl || el !== exceptEl) {
				el.classList.remove('toggle-legend-open');
			}
		});
	}

	function initControlValues() {
		selectedTab(s.get('mode'));

		doc.getElementById('copy-notification').value = s.get('copy-notification');
		doc.getElementById('ignore-pinned-tabs').checked = s.get('ignore-pinned-tabs') === 'true';
		doc.getElementById('show-in-context-menu').checked = s.get('show-in-context-menu') === 'true';

		refreshShortcutKey();
		setInterval(refreshShortcutKey, 1000);

		u.each(tcy.FORMAT_PREFIXES, initFormatOptions);
	}

	function refreshShortcutKey() {
		b.getAllCommands(function(arr) {
			for (var i = arr.length; i--;) {
				if (arr[i].name === 'copy-tabs') {
					doc.getElementById('shortcut-key').textContent = arr[i].shortcut || 'None';

					doc.getElementById('shortcut-key-description').style.display = arr[i].shortcut ? '' : 'none';

					break;
				}
			}
		});
	}

	function initFormatOptions(prefix) {
		var id;

		u.each(doc.getElementById(prefix + '-copy-format').children, function(optionEl) {
			optionEl.textContent = tcy.formatName(optionEl.value);
		});

		u.each(['-copy-format', '-compact-separator', '-custom-tab', '-custom-name', '-custom-start', '-custom-end', '-custom-delimiter'], function(postfix) {
			id = prefix + postfix;
			doc.getElementById(id).value = s.get(id);
		});

		id = prefix + '-html-table-include-header';
		doc.getElementById(id).checked = s.get(id) === 'true';
	}

	function setControlStates(prefix) {
		if (prefix) { // limit scope to a format option set
			setFormatOptionsStates(prefix);
		} else {
			var simpleMode = selectedTab() === 'simple';

			doc.getElementById('mode-description-fancy').style.opacity = simpleMode ? '0' : '1';
			doc.getElementById('mode-options-simple').style.display = simpleMode ? '' : 'none';
			doc.getElementById('mode-options-fancy').style.display = simpleMode ? 'none' : '';

			u.each(tcy.FORMAT_PREFIXES, setFormatOptionsStates);
		}
	}

	function setFormatOptionsStates(prefix) {
		var formatEl = doc.getElementById(prefix + '-copy-format');

		// if (formatEl.value === 'none') {
		//     formatEl.style.background='transparent';
		// } else  {
		//     formatEl.style.background='';
		// }

		tcy.tabsText(SAMPLE, formatEl.value, tcy.formatOptions(prefix, formatEl.value), function(str, tabCount, html) {
			var preview = doc.getElementById(prefix + '-copy-format-options-preview');
			if (html) {
				preview.innerHTML = html;
				// preview.style.whiteSpace = 'nowrap';
			} else {
				preview.textContent = str;
				// preview.style.whiteSpace = 'pre';
			}
		});

		doc.getElementById(prefix + '-compact-options').style.display = formatEl.value === 'compact' ? 'inline-block' : '';
		doc.getElementById(prefix + '-custom-options').style.display = formatEl.value === 'custom' ? 'inline-block' : '';
		doc.getElementById(prefix + '-html-table-options').style.display = formatEl.value === 'html-table' ? 'inline-block' : '';
	}

	function selectedTab(mode) {
		if (mode) {
			if (mode === 'simple') {
				tabSimpleMode.classList.add('tab-selected');
				tabFancyMode.classList.remove('tab-selected');
				tabIndicator.style.left = 0;
				return mode;
			}

			tabFancyMode.classList.add('tab-selected');
			tabSimpleMode.classList.remove('tab-selected');
			tabIndicator.style.left = TAB_WIDTH_PX + 'px';
			return 'fancy';
		}

		return doc.getElementById('tab-simple-mode').classList.contains('tab-selected') && 'simple' || 'fancy';
	}
}(document));
