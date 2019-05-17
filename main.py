# coding: utf-8
import os

from django import template
from django.conf import settings
from django.core.handlers import wsgi
from google.appengine.ext.webapp import util


settings._target = None
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

#template.base.add_to_builtins('templatetags.customfilters')

def main():
    """Loads the django application."""
    application = wsgi.WSGIHandler()
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()


