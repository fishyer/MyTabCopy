/* global tcy:true, u:true, b:true, safari:true */

(function(doc) {

	var bg = b.getBackgroundAPI(),
		s = tcy.s,
		formats = doc.getElementById('formats'),
		controlStateTimer;

	var FORMAT_BUTTON_PADDING_PX = 15;

	addEventListeners();

	setControlStates();

	if (b.BROWSER === 'safari') {
		safari.self.height = document.body.clientHeight;
		// safari.self.width = document.body.clientWidth;
	}

	function closePopup() {
		if (b.BROWSER === 'safari') {
			safari.self.hide();
		} else {
			window.close();
		}
	}

	function addEventListeners() {
		var i;

		doc.body.addEventListener('click', function(e) {
			if (e.target.classList.contains('action')) {
				if (e.target.classList.contains('disabled')) {
					e.target.style.animationName = 'nope';
				} else {
					for (i = 0; i < formats.children.length; i++) {
						if (formats.children[i].classList.contains('format-selected')) {
							bg.getAndCopyTabs(b.WINDOW_ID_CURRENT, idToRange(e.target.id), formats.children[i].dataset.prefix);
							break;
						}
					}

					closePopup();
				}
			} else if (e.target.classList.contains('format')) {
				for (i = formats.children.length; i--;) {
					if (e.target === formats.children[i]) {
						formats.children[i].classList.add('format-selected');
						s.set('selected-prefix', formats.children[i].dataset.prefix);
					} else {
						formats.children[i].classList.remove('format-selected');
					}
				}
			}
		});

		// doc.getElementById('open-options').addEventListener('click', function() {
		// 	b.openOptions();
		// 	closePopup();
		// });

		u.each([doc.getElementById('copy-tab'), doc.getElementById('copy-tabs-in-window'), doc.getElementById('copy-all-tabs')], function(el) {
			el.addEventListener('animationend', function() {
				this.style.animationName = '';
			}, false);
		});

		b.onTabOpen(setControlStatesDebounced);
		b.onTabClose(setControlStatesDebounced);
		b.onTabPinned(setControlStatesDebounced);
		b.onTabUnpinned(setControlStatesDebounced);

		// events below only relevant for programmatically-initiated events, since user-initiated such event closes popup

		b.onTabHighlighted(setControlStatesDebounced);
		b.onTabMoved(setControlStatesDebounced);

		window.addEventListener('storage', function(e) {
			if (e.key === 'mode') {
				closePopup();
				return;
			}

			if (e.key === 'ignore-pinned-tabs' || u.endsWith(e.key, '-copy-format') || u.endsWith(e.key, '-custom-name')) {
				setControlStatesDebounced();
			}
		});
	}

	function setControlStates() {
		b.getCurrentWindow(function(win) {
			var wid = win.id;

			b.queryTabs({}, function(tabs) {
				var countSelected = 0,
					countWindow = 0,
					countAll = 0,
					ignorePinnedTabs = s.get('ignore-pinned-tabs') === 'true',
					tab;

				for (var i = tabs.length; i--;) {
					tab = tabs[i];

					if (!ignorePinnedTabs || !tab.pinned) {
						countAll++;

						if (tab.windowId === wid) {
							countWindow++;
						}
					}

					// for range .SELECTED, we do not consider pinned state. Rule is that "Ignore pinned tabs" setting does not apply to selected tabs if range of interest is SELECTED tabs.

					if (tab.windowId === wid && tab.highlighted) {
						countSelected++;
					}
				}

				setButtonState(doc.getElementById('copy-tab'), countSelected, tcy.TAB_RANGE.SELECTED);
				setButtonState(doc.getElementById('copy-tabs-in-window'), countWindow, tcy.TAB_RANGE.WINDOW);
				setButtonState(doc.getElementById('copy-all-tabs'), countAll, tcy.TAB_RANGE.ALL);

				function setButtonState(el, count, range) {
					el.textContent = tcy.countLabel(count, range, 'Copy ');

					if (count) {
						el.classList.remove('disabled');
						el.removeAttribute('title');
					} else {
						el.classList.add('disabled');
						if (ignorePinnedTabs) {
							el.setAttribute('title', 'Pinned tabs are currently ignored\nSee TabCopy options');
						}
					}
				}

				setFormats();
			});
		});
	}

	function idToRange(id) {
		switch (id) {
			case 'copy-tab':
				return tcy.TAB_RANGE.SELECTED;
			case 'copy-tabs-in-window':
				return tcy.TAB_RANGE.WINDOW;
			case 'copy-all-tabs':
				return tcy.TAB_RANGE.ALL;
		}
	}

	function setControlStatesDebounced() {
		clearTimeout(controlStateTimer);
		controlStateTimer = setTimeout(setControlStates, 500);
	}

	function setFormats() {
		doc.getElementById('formats').style.display = '';

		formats.innerHTML = '';

		u.each(['fancy-0', 'fancy-1', 'fancy-2'], function(prefix) {
			if (s.get(prefix + '-copy-format') !== 'none') {
				formats.appendChild(createFormatEl(tcy.formatNameCustomized(prefix), prefix));
			}
		});

		var i, maxWidth = 0;
		for (i = formats.children.length; i--;) {
			maxWidth = Math.max(maxWidth, formats.children[i].clientWidth);
		}

		maxWidth = maxWidth + FORMAT_BUTTON_PADDING_PX * 2 + 'px';

		for (i = formats.children.length; i--;) {
			formats.children[i].style.minWidth = maxWidth;
			formats.children[i].style.display = 'table-cell';
		}

		doc.getElementById('formats').style.display = 'table';
	}

	function createFormatEl(name, prefix) {
		var el = doc.createElement('div');

		el.classList.add('format');
		el.dataset.prefix = prefix;
		el.textContent = name;

		if (s.get('selected-prefix') === prefix) {
			el.classList.add('format-selected');
		}

		return el;
	}

}(document));
