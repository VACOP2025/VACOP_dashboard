## Development Setup

To run the application locally for development for the 1st time:

```bash
docker-compose down --remove-orphans    

docker rm -f vacop_backend || true

docker-compose up --build
```


## Run the app

To run the app or restart the app :
```bash
docker-compose down
```
then 
```bash
docker-compose up --build
```
And you can access the app via localhost address on your browser. 
