'use strict';

const {
  dialogflow,
  Suggestions,
  RegisterUpdate,
} = require('actions-on-google');

const functions = require('firebase-functions');

// Firebase admin import
const admin = require('firebase-admin');

// Initialize Firestore
admin.initializeApp();
const db = admin.firestore();

// Firestore constants
const FirestoreNames = {
 INTENT: 'intent',
 USER_ID: 'userId',
 USERS: 'users',
};

// Actions API authentication imports
const {auth} = require('google-auth-library');
const request = require('request');

// Dialogflow app instance 
const app = dialogflow({debug: true});

/*
 * Fallback counting that runs before every intent handler.
 * Will reset the fallback count to 0 if the intent
 * is anything other than the fallback intent.
 */
app.middleware((conv) => {
  if (!conv.data.fallbackCount || !(conv.intent === 'Fallback')) {
    conv.data.fallbackCount = 0;
  }
});

// No Input intent handler
app.intent('No Input', (conv) => {
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask(`Sorry, I can't hear you.`);
  } else if (repromptCount === 1) {
    conv.ask(`I'm sorry, I still can't hear you.`);
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close(`I'm sorry, I'm having trouble here. ` +
      'Maybe we should try this again later.');
  }
});

// Fallback intent handler
app.intent('Fallback', (conv) => {
  conv.data.fallbackCount++;
  if (conv.data.fallbackCount === 1) {
    conv.ask('Sorry, what was that?');
  } else if (conv.data.fallbackCount === 2) {
    conv.ask(`I didn't quite get that. I can tell you our hours ` +
      'or what classes we offer each day.');
  } else {
    conv.close(`Sorry, I'm still having trouble. ` +
      `So let's stop here for now. Bye.`);
  }
 });

 exports.fulfillment = functions.https.onRequest(app);

 // Debug intent to trigger a test push notification
app.intent('Test Notification', (conv) => {
  // Use the Actions API to send a Google Assistant push notification.
  let client = auth.fromJSON(require('./service-account.json'));
  client.scopes = ['https://www.googleapis.com/auth/actions.fulfillment.conversation'];
  let notification = {
    userNotification: {
      title: 'Reminder for assignment due',
    },
    target: {},
  };
  client.authorize((err, tokens) => {
    if (err) {
      throw new Error(`Auth error: ${err}`);
    }
  });
 });
