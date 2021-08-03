let Disp = require("../../utils/Dispatcher.js");

let msgPackager = require("./msgpackager.js");

let msgType = require("./msgtype.js");

let msgStorage = new Disp();

let disp = require("../../utils/broadcast.js");

// 收到消息
msgStorage.saveReceiveMsg = function(receiveMsg, type) {
	let sendableMsg;

	sendableMsg = receiveMsg;

	this.saveMsg(sendableMsg, type, receiveMsg);
};

msgStorage.saveMsg = function(sendableMsg, type, receiveMsg) {
	console.log('要存储的信息', sendableMsg)
	let me = this;
	let userinfo = uni.getStorageSync("USER_INFO");
	let myName = 'heiban' + userinfo.id;
	let sessionKey; // 仅用作群聊收消息，发消息没有 receiveMsg

	if (receiveMsg && receiveMsg.type.toLowerCase() == "groupchat") {
		sessionKey = receiveMsg.to + myName;
	} // 群聊发 & 单发 & 单收
	else {
		sessionKey = myName + sendableMsg.from;
	}

	let curChatMsg = uni.getStorageSync(sessionKey) || [];
	let renderableMsg = msgPackager(sendableMsg, type, myName);


	curChatMsg.push(renderableMsg); //console.log('renderableMsgrenderableMsg', renderableMsg)



	save();

	function save() {
		uni.setStorage({
			key: sessionKey,
			data: curChatMsg,

			success() {
				console.log('新消息存储成功')
				me.fire("newChatMsg", renderableMsg, type, curChatMsg, sessionKey);
			}

		});
	}
};

// 存储自己发的消息
msgStorage.oldSaveMsg = function(sendableMsg, type, receiveMsg) {
	let me = this;
	let userinfo = uni.getStorageSync("USER_INFO");
	let myName = 'heiban' + userinfo.id;
	let sessionKey; // 仅用作群聊收消息，发消息没有 receiveMsg

	if (receiveMsg && receiveMsg.type.toLowerCase() == "groupchat") {
		sessionKey = receiveMsg.to + myName;
	} // 群聊发 & 单发 & 单收
	else {
		sessionKey = myName + sendableMsg.to;
	}

	let curChatMsg = uni.getStorageSync(sessionKey) || [];
	console.log(curChatMsg)
	var historyChatMsgs = uni.getStorageSync("rendered_" + sessionKey) || [];
	historyChatMsgs = historyChatMsgs.concat(curChatMsg);
	historyChatMsgs.push(sendableMsg);
	save();

	function save() {
		uni.setStorage({
			key: "rendered_" + sessionKey,
			data: historyChatMsgs,

			success() {
				uni.setStorageSync(sessionKey, null)
				console.log('老消息存储成功')
			}

		});
	}
};

// 删除消息
msgStorage.delMsg = function(sendableMsg, roomDataid, receiveMsg) {
	let me = this;
	let userinfo = uni.getStorageSync("USER_INFO");
	let myName = 'heiban' + userinfo.id;
	let sessionKey; // 仅用作群聊收消息，发消息没有 receiveMsg
	if (receiveMsg && receiveMsg.type.toLowerCase() == "groupchat") {
		sessionKey = receiveMsg.to + myName;
	} // 群聊发 & 单发 & 单收
	else {
		sessionKey = myName + 'heiban' + roomDataid;
	}

	var historyChatMsgs = uni.getStorageSync("rendered_" + sessionKey) || [];
	var ind1 = historyChatMsgs.findIndex(function(a, b) {
		return a.id == sendableMsg.id;
	})
	if (ind1 != -1) {
		historyChatMsgs.splice(ind1, 1);
	}
	uni.setStorageSync("rendered_" + sessionKey, historyChatMsgs)

};

// 撤回消息
msgStorage.withdrawMsg = function(message) {
	var to = message.to;
	var fromid = message.from;
	let userinfo = uni.getStorageSync("USER_INFO");
	let myName = 'heiban' + userinfo.id;
	var sessionKey, newMsg, oldMsg;
	if (to.indexOf("heiban") != -1) {
		sessionKey = to + fromid;
	} else {
		sessionKey = to + myName;
	}
	newMsg = uni.getStorageSync(sessionKey) || [];
	oldMsg = uni.getStorageSync("rendered_" + sessionKey) || [];
	var ind1 = newMsg.findIndex(function(a, b) {
		return a.id == message.mid;
	})
	var ind2 = oldMsg.findIndex(function(a, b) {
		return a.id == message.mid;
	})
	if (ind1 != -1) {
		newMsg.splice(ind1, 1);
	}
	if (ind2 != -1) {
		oldMsg.splice(ind2, 1);
	}

	uni.setStorageSync(sessionKey, newMsg);
	uni.setStorageSync("rendered_" + sessionKey, oldMsg);
	this.fire("em.withdrawMsg", message);
}

module.exports = msgStorage;
