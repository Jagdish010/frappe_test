# -*- coding: utf-8 -*-
# Copyright (c) 2021, Jagdish and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
import requests
import json

@frappe.whitelist()
def catogery_list():
	data = fetch_api_data()
	data = json.loads(data)

	c_list = []
	for event in data.get('events'):
		for catogery in event.get('categories'):
			c_list.append(catogery.get('title'))
	
	# create a unique value list
	c_list = set(c_list)
	
	return list(c_list)


@frappe.whitelist()
def events_list(**kwargs):
	data = fetch_api_data()
	data = json.loads(data)

	e_list = {}
	for event in data.get('events'):
		add_event = 0
		for catogery in event.get('categories'):
			if kwargs.get('catogery') == catogery.get('title'):
				add_event = 1

		if add_event:
			if not event.get('id'): continue
			
			e_list.setdefault(event.get('id'), {
				'id': event.get('id'),
				'title': event.get('title'),
				'coordinates': [cord.get('coordinates') for cord in event.get('geometries')]
				}
			)

	return e_list


def fetch_api_data():
	url = "https://eonet.sci.gsfc.nasa.gov/api/v2.1/events"

	querystring = {}
	
	payload = ""

	headers = { }

	response = requests.request("GET", url, data=payload, headers=headers, params=querystring)

	return response.text or {}
