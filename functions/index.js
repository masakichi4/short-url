const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const express = require("express");
const app = express();
var firebase = require("firebase");
require("firebase/firestore");


var firebaseConfig = {
  apiKey: "",
  authDomain: "short-url-app.firebaseapp.com",
  databaseURL: "https://short-url-app.firebaseio.com",
  projectId: "short-url-app",
  storageBucket: "short-url-app.appspot.com",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();

app.use(express.urlencoded());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ' https://us-central1-short-url-app.cloudfunctions.net/app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
// generates short url from id
const idToShortUrl = (id) => {
	let short_url = ''
	while (id > 0) {
		short_url += chars[id%62]
		id = Math.floor(id/62)
	}
	return short_url.split("").reverse().join("")
}

// converts short url to id
const shortUrlToId = (short_url) => {
	let id = 0
	for (let i=0; i<short_url.length; i++) {
		id = id * 62 + chars.indexOf(short_url.charAt(i));
	}
	return id
} 

// Looks for long url in database, then redirects short url to original url
app.get("/:short_url",(req, res) => {
	const short_url = req.params.short_url
	const id = shortUrlToId(short_url);

	let long_url;
	const docRef = db.collection('/long_url').doc(id.toString())
	docRef.get().then(
		(doc) => {
			if (doc.exists) {
		        const data = doc.data()
		        long_url = data['url'];
		        res.redirect(long_url)
		    } else {
		        // doc.data() will be undefined in this case
		        console.log("No long url!");
		        res.send("An error occured.")
		    }
		}).catch(function(error) {
		    console.log("Error getting document:", error);
		    res.send("An error in database occured.")
		});
	
})

// Reads count of urls stored 
// reads long url from form, and stores the long url with count plus one
// finally, displays short url to user
app.post("/", (req, res) => {
	let count;
	const docRef = db.collection('counter').doc('count')
	docRef.get().then(
		(doc) => {
			if (doc.exists) {
		        count = doc.data()['value'];
		        count += 1;
				countStr = count.toString();
				db.collection('long_url').doc(countStr).set({url: req.body.url});
				db.collection('counter').doc('count').set({value: count});
				const short_url = idToShortUrl(count);
				res.send(`The short url for ${req.body.url} is: <a href='https://us-central1-short-url-app.cloudfunctions.net/app/${short_url}'>https://us-central1-short-url-app.cloudfunctions.net/app/${short_url}</a>`);
		    } else {
		        // doc.data() will be undefined in this case
		        console.log("Error: No counter");
		        res.send("An error occured.")
		    }
		}).catch(function(error) {
		    console.log("Error getting document:", error);
		    res.send("An error in database occured.")
		});
})

app.get("/", (req, res) => {
    const html = "<form action='/app' method='post'><div>Convert long url here: <input name='url' type='text' value=''/><button type='submit'/>ok</button></div></form>"
    res.status(200).send(html)
})

exports.app = functions.https.onRequest(app);
