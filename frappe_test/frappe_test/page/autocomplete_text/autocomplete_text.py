# -*- coding: utf-8 -*-
# Copyright (c) 2021, Jagdish and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _

from os.path import isfile, join, dirname
import pandas
import json

@frappe.whitelist()
def autocomplete_text(**kwargs):
	countries_csv = join(dirname(__file__), "countries.csv")

	if not isfile(countries_csv):
		frappe.throw(_("Data File Don't Exists"))
	
	countries = pandas.read_csv(countries_csv, 
		usecols=['Country', 'Capital'])
	
	countries = countries.to_dict('records')
	countries = filter(lambda countrie: custom_filter(countrie, kwargs.get('search')), countries)
	# frappe.errprint(str(countries))
	
	return countries[: (kwargs.get('top') or 5)]


def custom_filter(countrie, search):
	if not countrie or not countrie['Country']: return 0
	if search is None or str(search).lower() in str(countrie['Country']).lower(): return 1
