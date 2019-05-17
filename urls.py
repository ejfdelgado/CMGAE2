# coding: utf-8
"""Defines the url patterns for the application."""

from django.conf.urls import defaults
from handlers.MainHandler import MainHandler
from handlers.StorageHandler import StorageHandler


urlpatterns = defaults.patterns(
    'handlers',
    (r'^storage/?(.*)', StorageHandler),
    (r'^(.*)$', MainHandler),
    
)

