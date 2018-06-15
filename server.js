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

function hasToken(req,res,next){
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader === 'undefined'){
        var token = jwt.sign({},'secret');
        console.log(token);
        res.set(token);
        req.set(token);
        console.log(res.header);
    }
    next();
}

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
function assignEvent(tokenz, eventid) {
    var decoded = jwt.decode(tokenz, { complete: true });
    Object.assign(decoded.payload, { [eventid]: true });
    console.log(decoded.payload);
    token = jwt.sign(decoded.payload, 'secret');
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

app.post('/addComment', (req, res) => {
    console.log(req.body.comment);
    var decoded = jwt.decode(req.header.token, { complete: true });
    if (!decoded.payload.hasOwnProperty(req.body.eventid)) {
        db.none('INSERT into feedback(eventid,eventname,comment,rating,created) VALUES($1,$2,$3,$4,$5)', [req.body.eventid, req.body.eventname, req.body.comment, req.body.rating, req.body.timestamp])
            .then(() => {
                assignEvent(token,req.body.eventid);
                console.log('Successfully added Commment')
                console.log(jwt.decode(token, { complete: true }));
                res.status(200).send({
                    'Success': 'Added Comment Successfully'
                })
            })
            .catch(error => {
                console.log(error);
                res.status(500).send({
                    'failed': 'Error occured'
                })
            })
    } else {
        res.status(403).send({
            'failed': 'You already made a comment on this topic'
        })
    }

});

app.post('/removeComment', (req, res) => {
    console.log(req.body.id);
    db.none('DELETE from feedback WHERE id = $1', [req.body.id])
        .then(() => {
            console.log("Successfully removed the comment with id: " + req.body.id);
            res.status(200).send({
                'success': 'Deleted Feedback'
            })
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                'failed': 'Error occured for this deletion'
            })
        })
})

app.post('/getComment', (req, res) => {
    db.any('SELECT * FROM feedback where eventid =$1 AND eventname = $2', [req.body.eventid, req.body.eventname])
        .then(function (data) {
            console.log(req.body.eventid);
            console.log(req.body.eventname);
            console.log(data);
            if (data.length > 0)
                res.status(200).send(data);
            else {
                res.status(404).send({
                    'failed': 'No matching comments'
                })
            }
        })
        .catch(error => {
            res.status(500).send({
                'failed': 'Error occured while fetching'
            })
        })
})


app.post('/updateRating', (req, res) => {
    db.none('UPDATE feedback SET rating = $1, updated = $2 WHERE id = $3', [req.body.rating, req.body.timestamp, req.body.id])
        .then(() => {
            res.status(200).send({
                'success': 'Updated Columns'
            })
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                'failed': 'Error occured while updating'
            })
        })
})

app.post('/updateComment', (req, res) => {
    db.none('UPDATE feedback SET comment = $1, updated = $2 WHERE id = $3', [req.body.comment, req.body.timestamp, req.body.id])
        .then(() => {
            res.status(200).send({
                'success': 'Updated Columns'
            })
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                'failed': 'Error occured while updating'
            })
        })
})






// DIAGNOSTICS
app.get('/api/event', function (req, res) {
    res.json(currentEvent);
});

app.get('/say-hello', function (req, res) {
    res.send('Hello World!');
});

app.get('/whattimeisit', function (req, res) {
    res.send(new Date(Date.now()).toString());
});

// REMOTE SCHEDULER
app.get('/schedule/:year/:month/:day/:hour/:min/:sec/:title/:msg/:type', function (req, res) {
    scheduler.schedule(req.params.year, req.params.month, req.params.day, req.params.hour, req.params.min, req.params.sec, () => push(req.params.title, req.params.msg, req.params.type));
    res.send('Task scheduled');
});

app.use(fallback('index.html', { root: root }));

// PUSH NOTIFICATION
app.post('/push/:title/:msg/:type', (req, res) => {
    var title = req.params.title,
        msg = req.params.msg,
        type = req.params.type;
    push(title, msg, type);
    res.send(`Sent ${title}: ${msg}.`);
});

// SUBSCRIBERS
app.post('/registerSubscription', (req, res) => {
    getAllSubscriptions().then((data) => {
        let subscriptions = data;
        if (!checkSubscription(subscriptions, req.body)) {
            subscriptions.push(req.body);
            return saveSubscription(subscriptions);
        }
        return;
    })
        .then(() => {
            res.status(200).send({ success: true });
        })
        .catch(() => {
            res.sendStatus(500);
        });
});

app.post('/unregisterSubscription', (req, res) => {
    getAllSubscriptions().then((data) => {
        let subscriptionObject = req.body;
        let subscriptions = data;

        subscriptions = subscriptions.filter(el => el.endpoint !== subscriptionObject.endpoint);
        return saveSubscription(subscriptions);
    }).then(() => {
        res.status(200).send({ success: true });
    })
        .catch(() => {
            res.sendStatus(500);
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
