const express = require('express');
const fallback = require('express-history-api-fallback');
const nocache = require('nocache');
const path = require('path');
const webpush = require('web-push');
const file = require('fs');
const bodyParser = require('body-parser');
const scheduler = require('./scheduler');
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.port || 5555;
const root = path.join(__dirname, 'public');
const subscriptionsFile = path.join(__dirname, 'subscriptions', 'subscriptions.json');
const util = require('./util.js');

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
app.use(hasToken);
//app.use(verifyToken);

function hasToken(request, response, next) {
    console.log('1. Middleware');
    const bearerHeader = request.headers['x-access-token'];
    console.log(bearerHeader);
    if (typeof bearerHeader === 'undefined') {
        var token = jwt.sign({Commentids: []}, util.secret);
        console.log(token);
        //response.send({ token: token });
        response.set("token", token);
        request.headers['x-access-token'] = token;
        console.log(request.headers['x-access-token']);
        //response.set(token);
    }
    else {
        console.log("Token found");
    }
    next();
}
/*
function verifyToken(request, response, next) {
    console.log('2. Middleware');
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(token);
    if (token) {
        var decoded = jwt.decode(token, { complete: true });
        request.decoded = decoded;
        console.log("This is the decoded token in the 2nd Middleware: " + decoded.payload);
        next();
    } else {
        return response.status(403).send({
            success: false,
            message: 'No token provided.'
        })
    }
}*/

var pgp = require('pg-promise')(/*options*/);

var cn = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'root'
};
let id = 109;

var db = pgp(cn);
/*
console.log(token);
var decoded = jwt.decode(token, { complete: true });
console.log(decoded.payload);
Object.assign(decoded.payload, { test: 'test' })
console.log(decoded.payload);
token = jwt.sign(decoded.payload, 'secret');
var decoded = jwt.decode(token, { complete: true });
console.log(decoded.payload);
console.log(token);
if (decoded.payload.hasOwnProperty('test')) {
    console.log("HURRAY IT WORKS");
} else {
    console.log("KMS");
}
*/
/*
function assignEvent(tokenz, eventid) {
    var decoded = jwt.decode(tokenz, { complete: true });
    Object.assign(decoded.payload, { [eventid]: true });
    console.log("assign event: " + decoded.payload);
    return jwt.sign(decoded.payload, 'secret');
}
*/

function assignPayload(oldToken, payload) {
    var decoded = jwt.decode(oldToken, { complete: true });
    Object.assign(decoded.payload, payload);
    return jwt.sign(decoded.payload, util.secret);
}

//example query
db.query('SELECT * from feedback where eventid = ' + id)
    .then(result => {
    })
    .catch(error => {
        console.log(error);
    });
let test = {
    "id": 130
}


/*db.none('INSERT INTO feedback(id,eventname) VALUES($1,$2)', [188,'niceEvent9000'])
.then(() => {
    console.log("success");
})
.catch(error => {
    console.log(error);
});
*/

app.post('/addComment', (request, response) => {
    console.log("Comment: " + request.body.comment);
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    if (!decoded.payload.hasOwnProperty(request.body.eventid)) {
        db.none('INSERT into feedback(eventid,eventname,comment,rating,created) VALUES($1,$2,$3,$4,$5)', [request.body.eventid, request.body.eventname, request.body.comment, request.body.rating, request.body.created])
            .then(() => {
                let payload = {
                    [request.body.eventid]: true,
                }
                let payloadToken = assignPayload(token, payload);

                console.log(jwt.decode(payloadToken, { complete: true }));
                console.log('Successfully added Commment')

                response.status(200).send({
                    'Success': 'Added Comment Successfully',
                    token: payloadToken
                })
            })
            .catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured'
                })
            })
    } else {
        response.status(403).send({
            'failed': 'You already made a comment on this topic'
        })
    }

});

app.post('/removeComment', (request, response) => {
    console.log(request.body.id);
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    if (decoded.payload.hasOwnProperty(request.body.eventid)) {
        db.none('DELETE from feedback WHERE id = $1', [request.body.id])
            .then(() => {
                console.log("Successfully removed the comment with id: " + request.body.id);
                let res = Object.assign({}, decoded);
                delete res[request.body.eventid];
                let newToken = jwt.sign(res.payload, util.secret);
                console.log("removeComment Token: " + jwt.decode(newToken, { complete: true }))
                response.status(200).send({
                    'success': 'Deleted Feedback',
                    'token': newToken
                })
            })
            .catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured for this deletion'
                })
            })
    } else {
        response.status(403).send({
            'failed': 'Can only delete your own comments',
            'token': token
        })
    }

})

app.post('/getComment', (request, response) => {
    db.any('SELECT * FROM feedback where eventid =$1 AND eventname = $2', [request.body.eventid, request.body.eventname])
        .then(function (data) {
            console.log(request.body.eventid);
            console.log(request.body.eventname);
            console.log(data);
            if (data.length > 0)
                response.status(200).send(data, {
                    'token': token
                });
            else {
                response.status(404).send({
                    'failed': 'No matching comments',
                    'token': token
                })
            }
        })
        .catch(error => {
            response.status(500).send({
                'failed': 'Error occured while fetching',
                'token': token
            })
        })
})


app.post('/updateRating', (request, response) => {
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    if (decoded.payload.hasOwnProperty(request.body.eventid)) {
        db.none('UPDATE feedback SET rating = $1, updated = $2 WHERE id = $3', [request.body.rating, request.body.timestamp, request.body.id])
            .then(() => {
                response.status(200).send({
                    'success': 'Updated Columns',
                    'token': token
                })
            })
            .catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured while updating',
                    'token': token
                })
            })
    } else {
        response.status(403).send({
            'failed': 'You can only edit your own ratings',
            'token': token
        })
    }

})

app.post('/updateComment', (request, response) => {
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    if (decoded.payload.hasOwnProperty(request.body.eventid)) {
        db.none('UPDATE feedback SET comment = $1, updated = $2 WHERE id = $3', [request.body.comment, request.body.timestamp, request.body.id])
            .then(() => {
                response.status(200).send({
                    'success': 'Updated Columns',
                    'token': token
                })
            })
            .catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured while updating',
                    'token': token
                })
            })
    }else {
        response.status(403).send({
            'failed' : 'You can only edit your own Comments',
            'token' : token
        })
    }

})






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
