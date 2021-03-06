# coding: utf-8
"""Django settings for app-engine-site-creator project."""

import os


APPEND_SLASH = False
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')
ROOT_PATH = os.path.dirname(__file__)
ROOT_URLCONF = 'urls'
TEMPLATE_DEBUG = DEBUG
TEMPLATE_CONTEXT_PROCESSORS = ()
TEMPLATE_DIRS = (
    os.path.join(ROOT_PATH, 'templates'),
)
TEMPLATE_LOADERS = (
    'mydjangoloaders.CloudStorageLoader',
    'django.template.loaders.filesystem.load_template_source'
)

FILE_UPLOAD_HANDLERS = ('django.core.files.uploadhandler.MemoryFileUploadHandler',)
FILE_UPLOAD_MAX_MEMORY_SIZE = 400*1024*1024 # the django default: 2.5MB

