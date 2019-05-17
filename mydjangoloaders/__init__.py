
import logging
import os

from django.template.base import TemplateDoesNotExist
from django.template.loaders import app_directories

from handlers import StorageHandler


class CloudStorageLoader(app_directories.Loader):
    is_usable = True

    def load_template(self, template_name, template_dirs=None):
        nuevoId = StorageHandler.generarRuta('/public', template_name)
        contenido = StorageHandler.read_file_interno(nuevoId)
        if (contenido is None):
            raise TemplateDoesNotExist(template_name)
        return (contenido, template_name)