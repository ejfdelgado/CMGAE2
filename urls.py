# coding: utf-8
"""Defines the url patterns for the application."""

from django.conf.urls import defaults
from handlers.MainHandler import MainHandler
from handlers.StorageHandler import StorageHandler
from handlers.AdminHandler import AdminHandler
from handlers.ShortUrl import ShortUrlHandler
from handlers.PageHandler import PageHandler
from handlers.DocHandler import DocHandler


urlpatterns = defaults.patterns(
    'handlers',
    (r'^api/xpage/?(.*)', PageHandler),
    (r'^api/xdoc/?(.*)', DocHandler),
    (r'^storage/?(.*)', StorageHandler),
    (r'^adm/?(.*)', AdminHandler),
    (r'^a/?(.*)', ShortUrlHandler),
    (r'^(.*)$', MainHandler),
)

