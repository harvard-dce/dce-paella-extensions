var test = require('tape');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var url = require('url');

// !! These tests require global mocks. If they need to be run in the same  
// process as another test in the future, teardowns need to be added.

var mockConfig = {
  heartBeatTime: 100          
};

var mockPaellaObject = {
  EventDrivenPlugin: '',
  plugins: {},
  player: {
    videoIdentifier: 'the-video-identifier',
    videoContainer: {
      currentTime: mockCurrentTime,
      trimStart: mockTrimStart,
      paused: mockPaused
    }
  },
  matterhorn: {
    resourceId: '/2015/03/33383/L10'
  }
};

test('Heartbeat tests', function heartbeatTests(t) {
  t.plan(15);

  // Set up mocks and checks.
  setUpMocks();
  setUpAssertingMocks(t);


  // Loading the plugin code actually executes the plugin.
  // That is how Paella plugins work.
  require('../vendor/plugins/edu.harvard.dce.paella.heartbeatSender/heartbeat_sender');

});

function setUpAssertingMocks(t) {
  global.base.Timer = timer;
  global.XMLHttpRequest = mockXHR;

  function timer(callback, time, params) {
    t.equal(
      typeof callback,
      'function',
      'Passes a function to the timer.'
    );
    t.equal(
      time,
      mockConfig.heartBeatTime,
      'Sets the timer to run at the interval specified in the config.'
    );

    callNextTick(callback, global.base.Timer);
    callNextTick(checkRepeatValue);

    var instance = this;

    function checkRepeatValue() {
      t.equal(instance.repeat, true, 'Sets the timer to repeat.');
    }
  }

  function mockXHR() {
    this.open = mockOpen;
    this.send = mockSend;
  }

  function mockOpen(method, URL) {
    t.equal(method, 'GET', 'Opens a request with the GET method.');
    // t.equal(URL, )
    checkHeartbeatURL(URL);
  }

  function mockSend() {
    t.pass('The xhr is actually sent.');
  }

  function checkHeartbeatURL(URL) {
    var urlParts = url.parse(URL, true);
    var query = urlParts.query;

    t.equal(urlParts.protocol, 'https:', 'Request is sent via https.');
    t.equal(urlParts.pathname, '/usertracking/', 'Request pathname is correct.');

    t.equal(
      query._method, 'PUT', 'Sends "PUT" as the "_method" query param.'
    );
    t.equal(
      query.id,
      mockPaellaObject.player.videoIdentifier,
      'id query param is set to the value of paella.player.videoIdentifier.'
    );
    t.equal(query.type, 'HEARTBEAT', 'type query param is correct.');
    t.equal(
      parseInt(query.in, 10),
      mockCurrentTime() + mockTrimStart(),
      '"in" query param is set to currentTime + trimStart.'
    );
    t.equal(
      parseInt(query.out, 10),
      mockCurrentTime() + mockTrimStart(),
      '"out" query param is also set to currentTime + trimStart.'
    );
    t.equal(
      query.resource,
      mockPaellaObject.matterhorn.resourceId,
      'resource query param is set to the value of paella.matterhorn.resourceId.'
    );

    var timestamp = new Date(query._);
    t.equal(
      typeof timestamp,
      'object',
      'The timestamp ("_") query param is a valid date.'
    );

    t.equal(
      query.playing,
      'true',
      'The playing query param should be set to the string "true".'
    );
  }
}

// opts is not a required parameter. But if you do specify it, here's an example
// of what is expected:
// {
//  classMethods: {
//    nameOfMethodYouWantAttachedToEveryInstance: function myFn() { ... },
//    otherMethod: function myOtherFn() { ... }
//  }
// }
function setUpMocks(opts) {
  global.location = {
    host: 'test-server'
  };

  global.paella = _.cloneDeep(mockPaellaObject);

  global.base = {};

  global.Class = function Class(classPath, classType, classDef) {
    var classSegments = classPath.split('.');
    if (classSegments.length === 3) {
      global.paella.plugins[classSegments[2]] = createClass;
    }

    function createClass() {
      var classInst = _.cloneDeep(classDef);
      classInst.config = _.cloneDeep(mockConfig);      
      classInst.setup();

      if (opts && opts.classMethods) {
        for (methodName in opts.classMethods) {
          classInst[methodName] = opts.classMethods[methodName];
        }
      }

      return classInst;
    }
  };
}

function mockCurrentTime() {
  return 300;
}

function mockTrimStart() {
  return 200;
}

function mockPaused() {
  return false;
}