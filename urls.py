# coding: utf-8
"""Defines the url patterns for the application."""

from django.conf.urls import defaults
from handlers.MainHandler import MainHandler
from handlers.StorageHandler import StorageHandler
from handlers.AdminHandler import AdminHandler


urlpatterns = defaults.patterns(
    'handlers',
    (r'^storage/?(.*)', StorageHandler),
    (r'^adm/?(.*)', AdminHandler),
    (r'^(.*)$', MainHandler),
)

