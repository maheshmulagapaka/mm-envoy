var express = require('express');
var _ = require('underscore-node');
var app = express();
var bodyParser = require('body-parser');
//var router = express.Router();
//app.use('/api', router); // register our route
var path = require('../list-view-constants')

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    next();
})

//will gets the cntscts ifo from contacts.json file.
var participantContacts = require(path.contacts);


app.get('/fusionrequestreport/:reportId', function(req, resp) {
    var reportData = require(path.reportData);
    reportId = req.params.reportId;

    resp.send(reportData[reportId]);
})

app.post('/uniquecount/:reportId', function(req, resp) {

    var nxtFieldValues = [];
    var data = {};
    var outputData = {
        result: []
    };
    var criteria = req.body.params.level;
    var size = Object.keys(criteria).length;
    var contacts = getContacts(req.params.reportId, criteria);

    nxtFieldValues = _.pluck(contacts, criteria[size].field);

    for (var i = 0, j = nxtFieldValues.length; i < j; i++) {
        if (data[nxtFieldValues[i]]) {
            data[nxtFieldValues[i]]++;
        } else {
            if (nxtFieldValues[i] != undefined)
                data[nxtFieldValues[i]] = 1;
        }
    };

    Object.entries(data).forEach(function([key, value]) {
        outputData.result.push({
            name: key,
            count: value
        });
    });
    resp.send(outputData);
});


app.post('/connnectionandcontactlisting/:reportId', function(req, resp) {
    var contacts = getContacts(req.params.reportId, req.body.params.level);
    var resultData = {
        result: []
    };
    _.each(contacts, (cntct) => {
        resultData.result.push(cntct.contactInfo);
    })


    switch (req.body.params.sort_by) {
        case 'name':
            sortingList(resultData, req.body.params.order);
            function sortingList(resultData, sortBy) {
                resultData.result.sort(function(a, b) {
                    if (sortBy == 'asc') {
                        var nameA = a.last_name.toUpperCase(); // ignore upper and lowercase
                        var nameB = b.last_name.toUpperCase(); // ignore upper and lowercase
                    } else {
                        var nameA = b.last_name.toUpperCase(); 
                        var nameB = a.last_name.toUpperCase(); 
                    }

                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                })
            };
            break;

        case 'count':
            if (req.body.params.order == 'asc') {
                resultData.result.sort(function(a, b) {
                    return a.participant_count - b.participant_count;
                });
            } else {
                resultData.result.sort(function(a, b) {
                    return b.participant_count - a.participant_count;
                });
            }
            break;
    }
    resp.send(resultData);
})


/**This function will be used by both the connnectionandcontactlisting & uniquecount calls.
 * It gets the all contacts then seperats the contacts which are matched withe critera sent by client and returs the seperated contacts.
 */
function getContacts(reportId, reqdata) {
    // var P1Contacts = participantContacts.P1Contacts;
    // var P2Contacts = participantContacts.P2Contacts;    
    // var contacts = [];   
    // contacts = contacts.concat(P1Contacts,P2Contacts);  
    var contacts = [];
    contacts = Object.assign([], participantContacts[reportId]);
    var nxtFieldValues = [];
    var data = {};
    var outputData = {
        result: []
    };


    var criteria = reqdata;
    var size = Object.keys(criteria).length;
    Object.entries(criteria).forEach(function([key, value]) {
        if (value.field == 'participant' && value.value) {
            value.field = 'participantId';
        }
    });
    //this block of code is executed when the fourth field of criteria is existed with the value.this cas will be occured only for the connnectionandcontactlisting api call. 
    if (criteria[4] && criteria[4].value) {
        for (var i = 1; i <= size; i++) {
            for (var j = 0; j < contacts.length; j++) {
                if (contacts[j][criteria[i].field] != criteria[i].value) {
                    contacts.splice(j, 1)
                    j--;
                }
            }
        }
    } else if (size != 1) {
        for (var i = 1; i <= size - 1; i++) {
            for (var j = 0; j < contacts.length; j++) {
                if (contacts[j][criteria[i].field] != criteria[i].value) {
                    contacts.splice(j, 1)
                    j--;
                }
            }
        }
    }

    return contacts;
}


var server = app.listen(8082, function() {

    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})




























































app.get('/', function (req, res) {
   console.log("Got a GET request for /list_user");
   res.send('HEllO WORLD!!!');
})

// // This responds with "Hello World" on the homepage
// app.get('/', function (req, res) {
//    console.log("Got a GET request for the homepage");
//    res.send('Hello GET');
// })

// // This responds a POST request for the homepage
// app.post('/', function (req, res) {
//    console.log("Got a POST request for the homepage");
//    res.send('Hello POST');
// })

// // This responds a DELETE request for the /del_user page.
// app.delete('/del_user', function (req, res) {
//    console.log("Got a DELETE request for /del_user");
//    res.send('Hello DELETE');
// })

// // This responds a GET request for the /list_user page.


// // This responds a GET request for abcd, abxcd, ab123cd, and so on
// app.get('/ab*cd', function(req, res) {  

//    console.log("Got a GET request for /ab*cd");
//    res.send('Page Pattern Match');
// })