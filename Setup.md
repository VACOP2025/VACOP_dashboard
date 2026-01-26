## Development Setup

To run the application locally for development for the 1st time:

```bash
sudo docker-compose down --remove-orphans    

sudo docker rm -f vacop_backend || true

sudo docker-compose up --build
```


## Run the app

To run the app or restart the app :
```bash
sudo docker-compose down
```
then 
```bash
sudo docker-compose up --build
```
And you can access the app via localhost address on your browser. 
