frappe.pages['task'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Task',
		single_column: true
	});

	wrapper.task_board = new TaskBoard(wrapper);
}


class TaskBoard {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find('.layout-main-section');
		this.wrapper.empty();
		this.make();
		this.bind_events();
		this.initialize_interval();
	}

	make() {
		this.prepare_dom();
		this.pull_user_task();
	}

	prepare_dom() {
		this.wrapper.append(`
		<div class="task-container">
			<ul id="task-list">
			</ul>
			<div id="new-task" class="header">
				<span id="addBtn">
					<i class="fa fa-plus" aria-hidden="true"></i>
				</span>
				<input type="text" id="create-task" placeholder="Enter Task ...">
			</div>
		</div>`);
	}

	bind_events() {
		var me = this;
		this.wrapper.find('#addBtn').on('click', function() {
			me.create_task();
		});

		this.wrapper.find('#create-task').keypress(function(event) {
			var keycode = event.keyCode || event.which;
			if(keycode == '13') {
				me.create_task();
			}
		});
	}

	initialize_interval() {
		var me = this;
		this.interval = setInterval(function() {
			var sysTime = moment().format('YYYY-MM-DD HH:mm:ss');

			var watchList = $('#task-list li.checked');
			watchList.each((idx, wrapper) => {
				me.updatetimer($(wrapper), sysTime);
			});
			// if (watchList == 0) clearInterval(this.interval);
			
		}, 1000);
	}

	updatetimer(wrapper, sysTime) {
		var taskID = wrapper.attr('task-id');
		if (!taskID) return;
		
		var task = this.task_list[taskID];

		var timePassed = this.time_diff(task, sysTime);
		wrapper.find('.timer').text(this.convert_durtime(timePassed));
	}

	time_diff(task, sysTime) {
		if (('starttime' in task) && task['starttime']) {
			var _diff = moment(sysTime, 'YYYY-MM-DD HH:mm:ss').diff(moment(task['starttime'], 'YYYY-MM-DD HH:mm:ss'));
			
			var inc_time = (task['timespend'] || 0);

			var diff_time = moment.duration(_diff).add(inc_time, 'hours');
			return diff_time.asHours();
		}

		return 0
	}

	convert_durtime(time) {
		var dur = moment.duration(time, 'hours');
		
		var hh = Math.floor(dur.asSeconds() / 3600),
		mm = Math.floor(dur.asSeconds() / 60) % 60,
		ss = Math.floor(dur.asSeconds()) % 60;

		return (hh ? (hh < 10 ? "0" : "") + hh + ":" : "") + ((mm < 10) && hh ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss
	}

	create_task() {
		var $input = this.wrapper.find('#create-task');

		var inputValue = $input.val();
		
		if (!String(inputValue).trim()) {
			alert("You must write something!");
		}
		else {
			this.create_user_task(inputValue);
		}

		$input.val('');
	}

	create_user_task(task) {
		var me = this;
		$.ajax({
			method: "GET",
			url: "/",
			data: {
				cmd: "frappe_test.frappe_test.doctype.pagetask.pagetask.create_task",
				user: frappe.session.user,
				task: task
			},
			dataType: "json",
			success: function(data) {
				var taskID = (data && data.message);
				Object.assign(me.task_list, {[taskID]: {'task': inputValue}});
				var new_task = $("<li>").attr('task-id', taskID).text(inputValue);
				me.listEvent(new_task);
				$('#task-list').append(new_task);
			}
		});
	}


	pull_user_task() {
		var me = this;
		// this.task_list = {'task_001': {'task': 'Hit the gym'},
		// 	'task_002': {'task': 'Pay bills', starttime: '2021-04-17 10:00:00', timespend: 1},
		// 	'task_003': {'task': 'Meet George', starttime: '2021-04-17 10:00:00'},
		// 	'task_004': {'task': 'Buy eggs', timespend: 45.345}
		// };

		$.ajax({
			method: "GET",
			url: "/",
			data: {
				cmd: "frappe_test.frappe_test.doctype.pagetask.pagetask.get_alltask",
				user: frappe.session.user
			},
			dataType: "json",
			success: function(data) {
				me.task_list = (data && data.message) || {};
				me.populate_task();
			}
		});
	}

	populate_task() {
		var me = this;
		Object.entries(this.task_list).forEach(([key, task]) => {
			var $task = $('<li>').attr('task-id', key).text(task.task);
			if (('starttime' in task) && task['starttime']) {
				$task.addClass('checked')
					.append($('<span>').addClass('timer'));
				me.updatetimer($task, task['starttime']);
			}
			
			$('#task-list').append($task);
			me.listEvent($task);
		});
	}

	listEvent(wrapper) {
		var me = this;
		wrapper.on('click', function() {
			var taskID = $(this).attr('task-id');

			if (!taskID) return;
			
			var task = me.task_list[taskID];
			var sysTime = moment().format('YYYY-MM-DD HH:mm:ss');
			
			if ($(this).hasClass('checked')) {
				me.update_task($(this), task, sysTime, 2);
			}
			else {
				me.update_task($(this), task, sysTime, 1);
			}
		});
	}


	update_task(wrapper, task, time, task_state) {
		var me = this;
		var spendtime = me.time_diff(task, time);

		frappe.call({
			method: 'frappe_test.frappe_test.doctype.pagetask.pagetask.update_task',
			args: {
				user: frappe.session.user,
				task_state: task_state,
				task: task.name,
				time: time,
				spendtime: spendtime
			},
			callback: function(data) {
				if (data && data.message) {
					if (task_state == 1) {
						task['starttime'] = time;
						wrapper.append($('<span>').addClass('timer').text(me.convert_durtime(task['timespend'] || 0)));
					}
					else if (task_state == 2) {
						task['timespend'] = spendtime;
						task['starttime'] = null;
						wrapper.find('.timer').remove();
					}
					wrapper.toggleClass('checked');
				}
			}
		})

		// $.ajax({
		// 	method: "GET",
		// 	url: "/",
		// 	data: {
		// 		cmd: "frappe_test.frappe_test.doctype.pagetask.pagetask.update_task",
		// 		user: frappe.session.user,
		// 		task_state: task_state,
		// 		task: task.name,
		// 		time: time,
		// 		spendtime: spendtime
		// 	},
		// 	dataType: "json",
		// 	success: function(data) {
		// 		if (data && data.message) {
		// 			if (task_state == 1) {
		// 				task['starttime'] = time;
		// 				wrapper.append($('<span>').addClass('timer').text(me.convert_durtime(task['timespend'] || 0)));
		// 			}
		// 			else if (task_state == 2) {
		// 				task['timespend'] = spendtime;
		// 				task['starttime'] = null;
		// 				wrapper.find('.timer').remove();
		// 			}
		// 		}
		// 	}
		// });
	}
}