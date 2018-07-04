const express = require('express');
const fallback = require('express-history-api-fallback');
const nocache = require('nocache');
const path = require('path');
const webpush = require('web-push');
const file = require('fs');
const bodyParser = require('body-parser');
const scheduler = require('./scheduler');
const app = express();
const port = process.env.port || 5555;
const root = path.join(__dirname, 'public');
const subscriptionsFile = path.join(__dirname, 'subscriptions', 'subscriptions.json');
const database = require('./database/database');
const hasTokenMiddleware = require('./routing/middlewares/hastokenmiddleware.js');
const routes = require('./routing/route.js');
const databasemodels = require('./database/databasemodels');
const Feedback = databasemodels.Feedback;
const feedbackController = require ('./routing/controllers/feedbackcontroller');
const pushOptions = {
    vapidDetails: {
        subject: 'http://www.google.com',
        publicKey: 'BMjRh7QofnoNTHxNAoM8wrfsCdEJH39JNg-P-JMnvyIOcuybzJcvwQt8wM6yPJad-phACdKLoGocjCfs9tZ4dL4',
        privateKey: '03xK2AyoX_eZNyx7tJm8972okURODqimuTOln71v55A'
    },
    TTL: 60 * 60
}
const currentEvent = require('./data/event.json');

app.use(nocache());
app.use(express.static(root));
app.use(bodyParser.json());
app.use(hasTokenMiddleware.hasToken);
app.use("/api", routes.loadRoutes(express));

database.initiateDatabase();

// DIAGNOSTICS
app.get('/api/event', function (request, response) {
    response.json(currentEvent);
});


app.get('/say-hello', function (request, response) {
    response.send('Hello World!');
});

app.get('/whattimeisit', function (request, response) {
    response.send(new Date(Date.now()).toString());
});

// REMOTE SCHEDULER
app.get('/schedule/:year/:month/:day/:hour/:min/:sec/:title/:msg/:type', function (request, response) {
    scheduler.schedule(request.params.year, request.params.month, request.params.day, request.params.hour, request.params.min, request.params.sec, () => push(request.params.title, request.params.msg, request.params.type));
    response.send('Task scheduled');
});

app.use(fallback('index.html', { root: root }));

// PUSH NOTIFICATION
app.post('/push/:title/:msg/:type', (request, response) => {
    var title = request.params.title,
        msg = request.params.msg,
        type = request.params.type;
    push(title, msg, type);
    response.send(`Sent ${title}: ${msg}.`);
});

// SUBSCRIBERS
app.post('/registerSubscription', (request, response) => {
    getAllSubscriptions().then((data) => {
        let subscriptions = data;
        if (!checkSubscription(subscriptions, request.body)) {
            subscriptions.push(request.body);
            return saveSubscription(subscriptions);
        }
        return;
    })
        .then(() => {
            response.status(200).send({ success: true });
        })
        .catch(() => {
            response.sendStatus(500);
        });
});

app.post('/unregisterSubscription', (request, response) => {
    getAllSubscriptions().then((data) => {
        let subscriptionObject = request.body;
        let subscriptions = data;

        subscriptions = subscriptions.filter(el => el.endpoint !== subscriptionObject.endpoint);
        return saveSubscription(subscriptions);
    }).then(() => {
        response.status(200).send({ success: true });
    })
        .catch(() => {
            response.sendStatus(500);
        });
});

// PRIVATE METHODS
function getAllSubscriptions() {
    return new Promise((resolve, reject) => {
        file.readFile(subscriptionsFile, (err, data) => {
            let result;
            if (!err) {
                result = data && data.length > 0 ? JSON.parse(data) : [];
            } else {
                result = [];
            }

            resolve(result);
        });
    });
}

function saveSubscription(subscriptions) {
    return new Promise((resolve, reject) => {
        file.writeFile(subscriptionsFile, JSON.stringify(subscriptions), { flag: 'w+' }, (err) => {
            if (err) {
                console.log('Cannot write subscriptions: ' + err.message);
                reject();
            }

            resolve();
        });
    });
}

function checkSubscription(subscriptions, subscriptionObject) {
    return subscriptions.findIndex(sub => sub.endpoint === subscriptionObject.endpoint) >= 0;
}

function removeSubscription(endpoint) {
    getAllSubscriptions().then((data) => {
        let subscriptions = data;

        subscriptions = subscriptions.filter(el => el.endpoint !== endpoint);
        return saveSubscription(subscriptions)
    })
        .catch();
}

function push(title, msg, type) {
    let icon = getIcon(type);
    getAllSubscriptions().then((subscriptions) => {
        subscriptions.forEach(subscriber => {
            webpush.sendNotification(
                subscriber,
                JSON.stringify({
                    "notification": {
                        "title": title,
                        "body": msg,
                        "icon": icon,
                        "vibrate": [100, 50, 100],
                        "data": {
                            "dateOfArrival": Date.now(),
                            "primaryKey": 1
                        }
                    }
                }),
                pushOptions)
                .then(() => {
                    //console.log(`Sending to ${subscriber.endpoint}...`);
                }).catch((err) => {
                    console.log('Error while pushing to [' + subscriber.endpoint + '] endpoint will be removed from subscribers list');
                    removeSubscription(subscriber.endpoint);
                });
        });
    });
}

function getIcon(type) {
    switch (type.toLowerCase()) {
        case "coffee":
            return "./assets/coffee.png";
        case "lunch":
            return "./assets/lunch.png";
        case "alert":
            return "./assets/alert.png";
        default:
            return "./assets/logo.png";
    }
}

const server = app.listen(port, function () {
    const address = server.address();
    const host = address.address;
    const port = address.port;

    // schedule meals
    scheduler.schedule(2018, 2, 15, 11, 0, 0, () => push("Architects- and Software Engineers Summit 2018", "Time for lunch!", "lunch"));
    scheduler.schedule(2018, 2, 15, 14, 15, 0, () => push("Architects- and Software Engineers Summit 2018", "Coffee break", "coffee"));
    scheduler.schedule(2018, 2, 15, 14, 15, 0, () => push("Architects- and Software Engineers Summit 2018", "Dinner time!", "lunch"));

    scheduler.schedule(2018, 2, 16, 8, 30, 0, () => push("Architects- and Software Engineers Summit 2018", "Coffee Break", "coffee"));
    scheduler.schedule(2018, 2, 16, 10, 30, 0, () => push("Architects- and Software Engineers Summit 2018", "Lunch time", "lunch"));
    scheduler.schedule(2018, 2, 16, 14, 45, 0, () => push("Architects- and Software Engineers Summit 2018", "Coffee Break", "coffee"));
    scheduler.schedule(2018, 2, 16, 17, 30, 0, () => push("Architects- and Software Engineers Summit 2018", "Time for dinner!", "lunch"));

    scheduler.schedule(2018, 2, 17, 11, 0, 0, () => push("Architects- and Software Engineers Summit 2018", "Lunch time!", "lunch"));

    console.log('Example app listening at http://%s:%s', host, port);
});
