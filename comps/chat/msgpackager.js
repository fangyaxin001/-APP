let WebIM = require("../../utils/WebIM.js")["default"];

let msgType = require("./msgtype.js");

module.exports = function (sendableMsg, type, myName) {
  var time = WebIM.time();
  var renderableMsg = sendableMsg;

  return renderableMsg;

  function getMsgData(sendableMsg, type) {
    if (type == msgType.TEXT) {
      return WebIM.parseEmoji(sendableMsg.value.replace(/\n/mg, ""));
    } else if (type == msgType.EMOJI) {
      return sendableMsg.value;
    } else if (type == msgType.IMAGE || type == msgType.VIDEO || type == msgType.AUDIO) {
      return sendableMsg.body.body.url;
    } else if (type == msgType.FILE) {
      return sendableMsg.body.body.msg;
    }

    return "";
  }
};