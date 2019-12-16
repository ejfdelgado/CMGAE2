# CMGAE2
CM para GAE

py -2 -m pip install -t lib/ -r requirements.txt
pip2 install -t lib/ -r requirements.txt

Al lanzar en Eclipse se debe agregar la siguiente variable de entorno:
set GOOGLE_APPLICATION_CREDENTIALS="E:\Google\proyeccion-colombia1-abed2c42047e.json"

gcloud auth login
gcloud app deploy app.yaml --project proyeccion-colombia1 --version 1