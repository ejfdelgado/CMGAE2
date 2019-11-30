# coding: utf-8
"""Defines the url patterns for the application."""

from django.conf.urls import defaults
from handlers.MainHandler import MainHandler
from handlers.StorageHandler import StorageHandler
from handlers.AdminHandler import AdminHandler
from handlers.ShortUrl import ShortUrlHandler
from handlers.PageHandler import PageHandler
from handlers.DocHandler import DocHandler
from handlers.ContHandler import ContHandler
from handlers.TuplaHandler import TuplaHandler
from handlers.VotaHandler import VotaHandler


urlpatterns = defaults.patterns(
    'handlers',
    (r'^api/xpage/?(.*)', PageHandler),
    (r'^api/xdoc/?(.*)', DocHandler),
    (r'^api/cont/?(.*)', ContHandler),
    (r'^api/tup/?(.*)', TuplaHandler),
    (r'^api/v/?(.*)', VotaHandler),
    (r'^storage/?(.*)', StorageHandler),
    (r'^adm/(.*)', AdminHandler),
    (r'^a/(.*)', ShortUrlHandler),
    (r'^(.*)$', MainHandler),
)

