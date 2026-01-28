// Firebase init v9
const firebaseConfig = {
  apiKey: "AIzaSyAyteudQPWB_RL-fwGY917Gi3SXIjWchNg",
  authDomain: "svitlo-availability-app.firebaseapp.com",
  projectId: "svitlo-availability-app",
  storageBucket: "svitlo-availability-app.firebasestorage.app",
  messagingSenderId: "993204375961",
  appId: "1:993204375961:web:9ede561341138799a40308",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
const VAPID_KEY = 'BCII_elwFU-0lcIIHbub_13Teuju9z4ZKCbPujJjyqSSP-Iqpjbul1XCo-V59e9YI_k-VXnp0bZe5-a21wevUtk';

// UI bindings 
var bt_register = $('#register');
var bt_delete = $('#delete');
var token = $('#token');
var form = $('#notification');
var massage_id = $('#massage_id');
var massage_row = $('#massage_row');

var info = $('#info');
var info_message = $('#info-message');

var alert = $('#alert');
var alert_message = $('#alert-message');

var input_body = $('#body');
var timerId = setInterval(setNotificationDemoBody, 10000);


// Helpers 
function setNotificationDemoBody() {
  if (input_body.val().search(/^It's found today at \d\d:\d\d$/i) !== -1) {
    var now = new Date();
    input_body.val(
      "It's found today at " + now.getHours() + ':' + addZero(now.getMinutes())
    );
  } else {
    clearInterval(timerId);
  }
}

function addZero(i) {
  return i > 9 ? i : '0' + i;
}

setNotificationDemoBody();
resetUI();


// Capability checks 
if (
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'localStorage' in window &&
  'fetch' in window
) {

  // If permission already granted, fetch token
  if (Notification.permission === 'granted') {
    getToken();
  }

  bt_register.on('click', getToken);

  bt_delete.on('click', async function () {
    try {
      const currentToken = await messaging.getToken({ vapidKey: VAPID_KEY });
      if (currentToken) {
        await messaging.deleteToken(currentToken);
        console.log('Token deleted');
        setTokenSentToServer(false);
        resetUI();
      }
    } catch (err) {
      showError('Unable to delete token', err);
    }
  });

  form.on('submit', function (event) {
    event.preventDefault();

    var notification = {};
    form.find('input').each(function () {
      var input = $(this);
      notification[input.attr('name')] = input.val();
    });

    sendNotification(notification);
  });

  // Foreground messages 
  messaging.onMessage(function (payload) {
    console.log('Message received', payload);

    info.show();
    info_message
      .text('')
      .append('<strong>' + payload.data.alert + '</strong>')
      .append('<em>' + payload.data.body + '</em>');

    // Optional: show notification while page is open
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(function (registration) {
        registration.showNotification(payload.data.alert, {
          body: payload.data.body,
          data: payload.data
        });
      });
    }
  });

} else {
  showError('This browser does not support push notifications');
  updateUIForPushPermissionRequired();
}

// Token handling 
async function getToken() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showError('Notification permission denied');
      return;
    }

    const currentToken = await messaging.getToken({
      vapidKey: VAPID_KEY
    });

    if (currentToken) {
      sendTokenToServer(currentToken);
      updateUIForPushEnabled(currentToken);
    } else {
      showError('No FCM token available');
      updateUIForPushPermissionRequired();
      setTokenSentToServer(false);
    }
  } catch (err) {
    showError('Error retrieving token', err);
    updateUIForPushPermissionRequired();
    setTokenSentToServer(false);
  }
}

// Send notification 
function sendNotification(notification) {
  console.log('Send notification', notification);
  massage_row.hide();

  messaging.getToken({ vapidKey: VAPID_KEY })
    .then(function (currentToken) {
      return fetch(
        'https://pushservertest.org/registerPushDevice',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            pushDeviceInfo: {
              appPackage: "com.webpush.testapp",
              appVersion: "1.1.0 (1)",
              providerUid: "PH5AckgzOkdAYjYmRmBWNEtGQ2ZOOEA7cC9+Pg==",
              pnsPushAddresses: [{
                pns: "fcm",
                pnsPushAddress: currentToken
              }],
              deviceUid: Math.random().toString(36).slice(2),
              platform: 1,
              osName: "WEB",
              canShowPushNotification: true
            }
          })
        }
      );
    })
    .then(res => res.json())
    .then(json => {
      massage_row.show();
      massage_id.text(
        json.deviceAddress?.deviceAddress || 'Something went wrong'
      );
    })
    .catch(showError);
}

// Token persistence
function sendTokenToServer(currentToken) {
  if (!isTokenSentToServer(currentToken)) {
    console.log('Sending token to server...');
    setTokenSentToServer(currentToken);
  }
}

function isTokenSentToServer(currentToken) {
  return window.localStorage.getItem('sentFirebaseMessagingToken') === currentToken;
}

function setTokenSentToServer(currentToken) {
  if (currentToken) {
    window.localStorage.setItem('sentFirebaseMessagingToken', currentToken);
  } else {
    window.localStorage.removeItem('sentFirebaseMessagingToken');
  }
}


// UI helpers
function updateUIForPushEnabled(currentToken) {
  token.text(currentToken);
  bt_register.hide();
  bt_delete.show();
  form.show();
}

function resetUI() {
  token.text('');
  bt_register.show();
  bt_delete.hide();
  form.hide();
  massage_row.hide();
  info.hide();
}

function updateUIForPushPermissionRequired() {
  bt_register.attr('disabled', 'disabled');
  resetUI();
}

function showError(error, data) {
  alert.show();
  alert_message.html(
    data ? error + '<br><pre>' + JSON.stringify(data) + '</pre>' : error
  );
  console.error(error, data || '');
}
