frappe.pages['autocomplete-text'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'AutoComplete Conundrum',
		single_column: true
	});

	wrapper.autocomplete_text = new AutoCompleteText(wrapper);
}


class AutoCompleteText {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find('.layout-main-section');
		this.wrapper.empty();
		this.prepare_dom();
		this.bind_events();
	}

	prepare_dom() {
		this.wrapper.append(`
		<div class="container" style="width:900px;">
			<h3 align="center">Country Data</h3>
			<br /><br />
			<div align="center">
			<input type="text" name="search" id="search" placeholder="Search Country" class="form-control" />
			</div>
			<ul class="list-group" id="countries-list"></ul>
			<br />
		</div>`);
	}

	bind_events() {
		var me = this;
		this.wrapper.find('#search').keyup(function() {
			var searchField = $(this).val();
			me.pull_data(searchField);
		});
	}

	pull_data(search) {
		var me = this;
		$.ajax({
			method: "GET",
			url: "/",
			data: {
				cmd: "frappe_test.frappe_test.page.autocomplete_text.autocomplete_text.autocomplete_text",
				search: search
			},
			dataType: "json",
			success: function(data) {
				me.render_list(data && data.message);
			}
		});
	}

	render_list(countries) {
		var me = this;
		me.wrapper.find('#countries-list').empty();
		(countries || []).forEach(row => {
			var countrie = $("<li>").addClass('list-group-item link-class').text(row['Country']);
			countrie.append($("<span>").addClass('text-muted').text(row['Capital']));
			me.wrapper.find('#countries-list').append(countrie);
		});
	}
}