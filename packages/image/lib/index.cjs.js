'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _regeneratorRuntime = require('@babel/runtime/regenerator');
var fs = require('fs');
var url = require('url');
var path = require('path');
var fetch = require('cross-fetch');
var sharp = require('sharp');
var PNG = require('@react-pdf/png-js');

function _interopDefaultLegacy(e) {
  return e && typeof e === 'object' && 'default' in e ? e : { default: e };
}

var _asyncToGenerator__default = /*#__PURE__*/ _interopDefaultLegacy(
  _asyncToGenerator,
);
var _regeneratorRuntime__default = /*#__PURE__*/ _interopDefaultLegacy(
  _regeneratorRuntime,
);
var fs__default = /*#__PURE__*/ _interopDefaultLegacy(fs);
var url__default = /*#__PURE__*/ _interopDefaultLegacy(url);
var path__default = /*#__PURE__*/ _interopDefaultLegacy(path);
var fetch__default = /*#__PURE__*/ _interopDefaultLegacy(fetch);
var sharp__default = /*#__PURE__*/ _interopDefaultLegacy(sharp);
var PNG__default = /*#__PURE__*/ _interopDefaultLegacy(PNG);

PNG__default['default'].isValid = function(data) {
  try {
    return !!new PNG__default['default'](data);
  } catch (e) {
    return false;
  }
};

// Extracted from https://github.com/devongovett/pdfkit/blob/master/lib/image/jpeg.coffee
var MARKERS = [
  0xffc0,
  0xffc1,
  0xffc2,
  0xffc3,
  0xffc5,
  0xffc6,
  0xffc7,
  0xffc8,
  0xffc9,
  0xffca,
  0xffcb,
  0xffcc,
  0xffcd,
  0xffce,
  0xffcf,
];

var JPEG = function JPEG(data) {
  this.data = null;
  this.width = null;
  this.height = null;
  this.data = data;

  if (data.readUInt16BE(0) !== 0xffd8) {
    throw new Error('SOI not found in JPEG');
  }

  var marker;
  var pos = 2;

  while (pos < data.length) {
    marker = data.readUInt16BE(pos);
    pos += 2;

    if (MARKERS.includes(marker)) {
      break;
    }

    pos += data.readUInt16BE(pos);
  }

  if (!MARKERS.includes(marker)) {
    throw new Error('Invalid JPEG.');
  }

  pos += 3;
  this.height = data.readUInt16BE(pos);
  pos += 2;
  this.width = data.readUInt16BE(pos);
};

JPEG.isValid = function(data) {
  if (!data || !Buffer.isBuffer(data) || data.readUInt16BE(0) !== 0xffd8) {
    return false;
  }

  var marker;
  var pos = 2;

  while (pos < data.length) {
    marker = data.readUInt16BE(pos);
    pos += 2;

    if (MARKERS.includes(marker)) {
      break;
    }

    pos += data.readUInt16BE(pos);
  }

  if (!MARKERS.includes(marker)) {
    return false;
  }

  return true;
};

var createCache = function createCache(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
    _ref$limit = _ref.limit,
    limit = _ref$limit === void 0 ? 100 : _ref$limit;

  var cache = {};
  var keys = [];
  return {
    get: function get(key) {
      return cache[key];
    },
    set: function set(key, value) {
      keys.push(key);

      if (keys.length > limit) {
        delete cache[keys.shift()];
      }

      cache[key] = value;
    },
    reset: function reset() {
      cache = {};
      keys = [];
    },
    length: function length() {
      return keys.length;
    },
  };
};

var IMAGE_CACHE = createCache({
  limit: 30,
});

var getAbsoluteLocalPath = function getAbsoluteLocalPath(src) {
  var _url$parse = url__default['default'].parse(src),
    protocol = _url$parse.protocol,
    auth = _url$parse.auth,
    host = _url$parse.host,
    port = _url$parse.port,
    hostname = _url$parse.hostname,
    pathname = _url$parse.path;

  var absolutePath = path__default['default'].resolve(pathname);

  if ((protocol && protocol !== 'file:') || auth || host || port || hostname) {
    return undefined;
  }

  return absolutePath;
};

var fetchLocalFile = function fetchLocalFile(src) {
  return new Promise(function(resolve, reject) {
    try {
      if (false);

      var absolutePath = getAbsoluteLocalPath(src);

      if (!absolutePath) {
        reject(new Error('Cannot fetch non-local path: ' + src));
        return;
      }

      fs__default['default'].readFile(absolutePath, function(err, data) {
        return err ? reject(err) : resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
};

var fetchRemoteFile = /*#__PURE__*/ (function() {
  var _ref = _asyncToGenerator__default['default'](
    /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(function _callee(
      uri,
      options,
    ) {
      var response, buffer;
      return _regeneratorRuntime__default['default'].wrap(function _callee$(
        _context,
      ) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.next = 2;
              return fetch__default['default'](uri, options);

            case 2:
              response = _context.sent;
              _context.next = 5;
              return response.buffer
                ? response.buffer()
                : response.arrayBuffer();

            case 5:
              buffer = _context.sent;
              return _context.abrupt(
                'return',
                buffer.constructor.name === 'Buffer'
                  ? buffer
                  : Buffer.from(buffer),
              );

            case 7:
            case 'end':
              return _context.stop();
          }
        }
      },
      _callee);
    }),
  );

  return function fetchRemoteFile(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

var isValidFormat = function isValidFormat(format) {
  var lower = format.toLowerCase();
  return lower === 'jpg' || lower === 'jpeg' || lower === 'png';
};

var guessFormat = function guessFormat(buffer) {
  var format;

  if (JPEG.isValid(buffer)) {
    format = 'jpg';
  } else if (PNG__default['default'].isValid(buffer)) {
    format = 'png';
  }

  return format;
};

var isCompatibleBase64 = function isCompatibleBase64(_ref2) {
  var uri = _ref2.uri;
  return /^data:image\/[a-zA-Z]*;base64,[^"]*/g.test(uri);
};

function getImage(_x3, _x4) {
  return _getImage.apply(this, arguments);
}

function _getImage() {
  _getImage = _asyncToGenerator__default['default'](
    /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(
      function _callee3(body, extension) {
        return _regeneratorRuntime__default['default'].wrap(function _callee3$(
          _context3,
        ) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                _context3.t0 = extension.toLowerCase();
                _context3.next =
                  _context3.t0 === 'jpg'
                    ? 3
                    : _context3.t0 === 'jpeg'
                    ? 3
                    : _context3.t0 === 'webp'
                    ? 4
                    : _context3.t0 === 'png'
                    ? 10
                    : 11;
                break;

              case 3:
                return _context3.abrupt('return', new JPEG(body));

              case 4:
                console.log(body);
                _context3.next = 7;
                return sharp__default['default'](body)
                  .jpeg()
                  .toBuffer();

              case 7:
                body = _context3.sent;
                console.log(body);
                return _context3.abrupt('return', new JPEG(body));

              case 10:
                return _context3.abrupt(
                  'return',
                  new PNG__default['default'](body),
                );

              case 11:
                return _context3.abrupt('return', null);

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        },
        _callee3);
      },
    ),
  );
  return _getImage.apply(this, arguments);
}

var resolveBase64Image = function resolveBase64Image(_ref3) {
  var uri = _ref3.uri;
  var match = /^data:image\/([a-zA-Z]*);base64,([^"]*)/g.exec(uri);
  var format = match[1];
  var data = match[2];

  if (!isValidFormat(format)) {
    throw new Error('Base64 image invalid format: ' + format);
  }

  return new Promise(function(resolve) {
    return resolve(getImage(Buffer.from(data, 'base64'), format));
  });
};

var resolveImageFromData = function resolveImageFromData(src) {
  if (src.data && src.format) {
    return new Promise(function(resolve) {
      return resolve(getImage(src.data, src.format));
    });
  }

  throw new Error('Invalid data given for local file: ' + JSON.stringify(src));
};

var resolveBufferImage = function resolveBufferImage(buffer) {
  var format = guessFormat(buffer);

  if (format) {
    return new Promise(function(resolve) {
      return resolve(getImage(buffer, format));
    });
  }

  return Promise.resolve();
};

var getImageFormat = function getImageFormat(body) {
  var isPng =
    body[0] === 137 &&
    body[1] === 80 &&
    body[2] === 78 &&
    body[3] === 71 &&
    body[4] === 13 &&
    body[5] === 10 &&
    body[6] === 26 &&
    body[7] === 10;
  var isJpg = body[0] === 255 && body[1] === 216 && body[2] === 255;
  var extension = '';

  if (isPng) {
    extension = 'png';
  } else if (isJpg) {
    extension = 'jpg';
  } else {
    extension = 'webp'; // throw new Error('Not valid image extension');
  }

  return extension;
};

var resolveImageFromUrl = /*#__PURE__*/ (function() {
  var _ref4 = _asyncToGenerator__default['default'](
    /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(
      function _callee2(src) {
        var uri, body, headers, _src$method, method, data, extension;

        return _regeneratorRuntime__default['default'].wrap(function _callee2$(
          _context2,
        ) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                (uri = src.uri),
                  (body = src.body),
                  (headers = src.headers),
                  (_src$method = src.method),
                  (method = _src$method === void 0 ? 'GET' : _src$method);

                if (!getAbsoluteLocalPath(uri)) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 4;
                return fetchLocalFile(uri);

              case 4:
                _context2.t0 = _context2.sent;
                _context2.next = 10;
                break;

              case 7:
                _context2.next = 9;
                return fetchRemoteFile(uri, {
                  body: body,
                  headers: headers,
                  method: method,
                });

              case 9:
                _context2.t0 = _context2.sent;

              case 10:
                data = _context2.t0;
                extension = getImageFormat(data);
                return _context2.abrupt('return', getImage(data, extension));

              case 13:
              case 'end':
                return _context2.stop();
            }
          }
        },
        _callee2);
      },
    ),
  );

  return function resolveImageFromUrl(_x5) {
    return _ref4.apply(this, arguments);
  };
})();

var resolveImage = function resolveImage(src, _temp) {
  var _ref5 = _temp === void 0 ? {} : _temp,
    _ref5$cache = _ref5.cache,
    cache = _ref5$cache === void 0 ? true : _ref5$cache;

  var image;
  var cacheKey = src.data ? src.data.toString() : src.uri;

  if (Buffer.isBuffer(src)) {
    image = resolveBufferImage(src);
  } else if (cache && IMAGE_CACHE.get(cacheKey)) {
    return IMAGE_CACHE.get(cacheKey);
  } else if (isCompatibleBase64(src)) {
    image = resolveBase64Image(src);
  } else if (typeof src === 'object' && src.data) {
    image = resolveImageFromData(src);
  } else {
    image = resolveImageFromUrl(src);
  }

  if (!image) {
    throw new Error('Cannot resolve image');
  }

  if (cache) {
    IMAGE_CACHE.set(cacheKey, image);
  }

  return image;
};

exports['default'] = resolveImage;
