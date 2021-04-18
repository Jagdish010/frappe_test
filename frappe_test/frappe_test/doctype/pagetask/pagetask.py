# -*- coding: utf-8 -*-
# Copyright (c) 2021, Jagdish and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.model.document import Document
import json

class PageTask(Document):
	pass


@frappe.whitelist(allow_guest=True)
def get_alltask(user):
	if not user:
		frappe.throw(_('Please Specify User'))
	
	created_task = """SELECT `PT`.`name`, `PT`.`task`, `PT`.`spend_time` AS timespend, `TT`.`start_time` AS starttime
		FROM `tabPageTask` AS `PT`
		LEFT JOIN (SELECT *
			FROM`tabTask Time`
			WHERE end_time IS NULL) AS `TT`
			ON `TT`.`parent` = `PT`.`name`
		WHERE `PT`.`owner` = '{}'""".format(user)
	created_task = frappe.db.sql(created_task, as_dict=True)

	task_dict = frappe._dict()
	for task in created_task:
		if not task.get('name'): return
		task_dict.setdefault(task.get('name'), task)

	return task_dict


@frappe.whitelist(allow_guest=True)
def create_task(**kwargs):
	if not kwargs.get('user'):
		frappe.throw(_('Please Specify User'))
	
	new_task = frappe.new_doc('PageTask')
	new_task.task = kwargs.get('task')
	new_task.owner = kwargs.get('user')

	new_task.insert(ignore_permissions=True)
	frappe.db.commit()

	return new_task.name


@frappe.whitelist(allow_guest=True)
def update_task(**kwargs):
	if not kwargs.get('user'):
		frappe.throw(_('Please Specify User'))
	
	if not kwargs.get('task'):
		frappe.throw(_('Task ID is mission'))

	task = frappe.get_doc('PageTask', kwargs.get('task'))
	
	if kwargs.get('task_state') == '1':
		task.append('time', {
			'start_time': kwargs.get('time')
		})
	
	elif kwargs.get('task_state') == '2':
		task.spend_time = kwargs.get('spendtime')

		last_task = len(task.get('time')) - 1
		timelog = task.get('time')[last_task]
		timelog.end_time = kwargs.get('time')
		
	task.save(ignore_permissions=True)
	frappe.db.commit()

	return 1