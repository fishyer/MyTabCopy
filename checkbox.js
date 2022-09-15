(function(undefined) {

	var KEYCODE_RETURN = 13;

	var g = this;

	g.Checkbox = function(q, $, binder) {
		var checkbox = {};

		checkbox.init = function(root) {
			checkbox.bind(root);
			checkbox.enhance(root);
		};

		// bind all tcy-checkboxes underneath a root node
		checkbox.bind = function(root) {
			$(root).find('.tcy-checkbox > input[type=checkbox][data-bind]').each(
				function() {
					var binding = binder(this.dataset.bind);

					if (binding) {
						var cb = this;
						cb.checked = binding.keva(binding.key);
						$(cb).on('change', function() {
							binding.keva(binding.key, cb.checked);
						});
						binding.keva.on(function(e) {
							// console.log(e);

							if (e.data.key === binding.key) {
								// console.log(e.data.newVal);
								q(cb.id).checked = e.data.newVal;
							}
						});
					}
				});
		};

		// add behaviors to all tcy-checkboxes underneath a root node
		checkbox.enhance = function(root) {
			$(root).find('.tcy-checkbox > input[type=checkbox]').each(
				function() {
					var cb = this;
					$(cb).on('keydown', function(e) {
						if (e.keyCode === KEYCODE_RETURN) {
							$(cb).prop('checked', !cb.checked).trigger('change');
						}
					});
				});
		};

		return checkbox;
	};

}).call(this);
