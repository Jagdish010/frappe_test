frappe.pages['our-glob'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Our Glob',
		single_column: true
	});

	wrapper.our_glob = new OurGlob(wrapper);
}

class OurGlob {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find('.layout-main-section');
		this.wrapper.empty();
		this.make();
		this.bind_event();
	}
	make() {
		this.prepare_dom();
		this.autocomplete_list();
		
	}
	prepare_dom() {
		this.wrapper.append(`
		<div class="container" style="width:900px; height: 600px">
			<div class="row">
				<div class="col-sm-6">
				<span class="text-muted">Category</span>
				<input type="text" id="category" placeholder="Search Category" class="form-control" />
				</div>
			</div>
			<div class="row">
				<div class="col-sm-3">
				<span class="text-muted">Events</span>
					<ul class="list-group" id="event-list"></ul>
				</div>
				<div class="col-sm-3">
				<span class="text-muted">Coordinate</span>
					<ul class="list-group" id="coordinate-list"></ul>
				</div>
				<div class="col-sm-6">
					<div class="gmap_canvas">
						<iframe width="600" height="500" id="gmap_canvas" src="https://maps.google.com/maps?q=&t=&z=13&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
					</div>
				</div>
			</div>
		</div>`);
	}

	autocomplete_list() {
		var me = this;
		frappe.call({
			method: 'frappe_test.frappe_test.page.our_glob.our_glob.catogery_list',
			freeze: true,
			freeze_message: __('loading catorgery'),
			callback: function(data) {
				me.wrapper.find("#category")
					.autocomplete({source: (data && data.message) || []});
			}
		})
	}

	bind_event() {
		var me = this;
		this.wrapper.find('#category').on('autocompleteselect', function(e, ui) {
			var select_category = ui.item.value;
			if (!select_category) return;

			me.load_event(select_category)
		});
	}

	load_event(catogery) {
		var me = this;
		frappe.call({
			method: 'frappe_test.frappe_test.page.our_glob.our_glob.events_list',
			args: {
				catogery: catogery
			},
			freeze: true,
			freeze_message: __('loading events'),
			callback: function(data) {
				me.events = (data && data.message) || {};
				me.render_list();
			}
		})
	}

	render_list() {
		var me = this;
		me.wrapper.find('#event-list').empty();
		Object.entries(this.events).forEach(([key, row]) => {
			var countrie = $("<li>").addClass('list-group-item link-class').text(row.title).attr('event-id', row.id);
			me.wrapper.find('#event-list').append(countrie);
			me.listEvent(countrie);
		});
	}

	listEvent(wrapper) {
		var me = this;
		wrapper.on('click', function() {
			var eventID = $(this).attr('event-id');

			if (!eventID) return;
			me.wrapper.find('#event-list li').removeClass('checked');
			$(this).addClass('checked');
			me.get_cordinate(eventID);
		});
	}

	get_cordinate(eventID) {
		var me = this;
		var cord_list = this.events[eventID]['coordinates'];
		// console.log(cord_list)
		this.wrapper.find('#coordinate-list').empty();
		(cord_list || []).forEach(row => {
			var cordinate = $("<li>").addClass('list-group-item link-class')
				.attr('cord-y', row[0])
				.attr('cord-x', row[1])
				.append($('<span class="text-muted">').text(row.join(', ')))
			me.wrapper.find('#coordinate-list').append(cordinate);
			me.cordinateEvent(cordinate);
		})
	}

	cordinateEvent(wrapper) {
		var me = this;
		wrapper.on('click', function() {
			me.wrapper.find('#coordinate-list li').removeClass('checked');
			$(this).addClass('checked');
			var x_cord = $(this).attr('cord-x');
			var y_cord = $(this).attr('cord-y');
			me.wrapper.find('#gmap_canvas').attr('src', `https://maps.google.com/maps?q=${x_cord}, ${y_cord}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
		});
	}

}