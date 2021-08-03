<script>
	import {
		WS_HOST
	} from '@/common/config.js'
	import {
		mapMutations,
		mapState
	} from 'vuex';
	import Vue from 'vue';
	var innerAudioContext = null;
	let WebIM = wx.WebIM = require("./utils/WebIM")["default"];
	let msgStorage = require("./comps/chat/msgstorage");
	let msgType = require("./comps/chat/msgtype");
	let disp = require("./utils/broadcast");
	let timer;
	var starStatus = true;
     
	function ack(receiveMsg) {
		// 处理未读消息回执
		var bodyId = receiveMsg.id; // 需要发送已读回执的消息id 
		var ackMsg = new WebIM.message("read", WebIM.conn.getUniqueId());
		
		ackMsg.set({
			id: bodyId,
			to: receiveMsg.from
		});
		WebIM.conn.send(ackMsg.body);
	} 
	function onMessageError(err) {
		if (err.type === "error") {
			uni.showToast({
				title: err.errorText
			});
			return false;
		}

		return true;
	}

	function getCurrentRoute() {
		let pages = getCurrentPages();
		if (pages.length > 0) {
			let currentPage = pages[pages.length - 1];
			return currentPage.route;
		}
		return '/'
	}

	// 不包含陌生人版本
	function calcUnReadSpot(message) {
		let userinfo = uni.getStorageSync("USER_INFO");
		let myName = 'heiban' + userinfo.id;
		let members = uni.getStorageSync("member") || []; //好友

		var listGroups = uni.getStorageSync("listGroup") || []; //群组
		let allMembers = members.concat(listGroups);
		var count = allMembers.reduce(function(result, curMember, idx) {
			let chatMsgs;
			if (curMember.groupid) {
				chatMsgs =
					uni.getStorageSync(curMember.groupid + myName.toLowerCase()) || [];
			} else {
				chatMsgs =
					uni.getStorageSync(
						curMember.name && myName.toLowerCase() + curMember.name.toLowerCase()
					) || [];
			}
			return result + chatMsgs.length;
		}, 0);
		getApp().globalData.unReadMessageNum = count;
		console.log('聊天未读数量', count, message)
		// 时候是刚进入app
		if (starStatus) {

			if (timer) {
				clearTimeout(timer)
			}
			timer = setTimeout(function() {
				uni.hideLoading();
				starStatus = false;
				disp.fire("StarStatusFun", null);
				if (count > 0) {
					uni.setTabBarBadge({
						index: 0,
						text: count > 99 ? '99+' : count + ""
					})
				} else {
					uni.removeTabBarBadge({
						index: 0
					})
				}
				disp.fire("em.unreadspot", message);
			}, 1000)
		} else {
			if (timer) {
				clearTimeout(timer)
			}
			timer = setTimeout(function() {
				if (count > 0) {
					uni.setTabBarBadge({
						index: 0,
						text: count > 99 ? '99+' : count + ""
					})
				} else {
					uni.removeTabBarBadge({
						index: 0
					})
				}
				disp.fire("em.unreadspot", message);
			}, 100)
		}
	}


	function saveGroups() {
		var me = this;
		return WebIM.conn.getGroup({
			limit: 50,
			success: function(res) {
				uni.setStorage({
					key: "listGroup",
					data: res.data
				});
			},
			error: function(err) {
				console.log(err);
			}
		});
	}

	export default {
		data() {
			return {
				member: []
			}
		},
		globalData: {
			unReadMessageNum: 0, //未读消息数
			userInfo: null,
			saveFriendList: [], //好友申请
			saveGroupInvitedList: [],
			isIPX: false, //是否为iphone X
			conn: {
				closed: false,
				curOpenOpt: {},

				open(opt) {
					uni.showLoading({
						title: "正在初始化客户端..",
						mask: true
					});
					this.curOpenOpt = opt;
					WebIM.conn.open(opt);
					this.closed = false;
				},

				reopen() {
					if (this.closed) {
						//this.open(this.curOpenOpt);
						WebIM.conn.open(this.curOpenOpt);
						this.closed = false;
					}
				}
			},
			// onShow(){
			// 	// WebIM.conn.reconnect();
			// 	disp.fire("appLoginSuccess");
			// },
			// onHide(){
			// 	WebIM.conn.close();
			// 	WebIM.conn.stopHeartBeat();
			// },
			// onUnload(){
			// 	WebIM.conn.close();
			// 	WebIM.conn.stopHeartBeat();
			// 	uni.redirectTo({
			// 		url: "../login/login?myName=" + myName
			// 	});
			// },
			onLoginSuccess: function(myName) {
				uni.hideLoading();
				uni.redirectTo({
					url: "/pages/message/index?myName=" + myName
				});
			},

			getUserInfo(cb) {
				var me = this;

				if (this.userInfo) {
					typeof cb == "function" && cb(this.userInfo);
				} else {
					// 调用登录接口
					uni.login({
						success() {
							uni.getUserInfo({
								success(res) {
									me.userInfo = res.userInfo;
									typeof cb == "function" && cb(me.userInfo);
								}
							});
						}
					});
				}
			},

			checkIsIPhoneX: function() {
				const me = this;
				uni.getSystemInfo({
					success: function(res) {
						// 根据 model 进行判断
						if (res.model && res.model.search("iPhone X") != -1) {
							me.isIPX = true;
						}
					}
				});
			}
		},
		onLaunch: function() {
			// #ifdef APP-PLUS
			plus.screen.lockOrientation('portrait-primary'); //竖屏
			// #endif
			var _this = this;
			uni.getSystemInfo({
				success: function(e) {
					// #ifndef MP
					Vue.prototype.StatusBar = e.statusBarHeight;
					if (e.platform == 'android') {
						Vue.prototype.CustomBar = e.statusBarHeight + 50;
					} else {
						Vue.prototype.CustomBar = e.statusBarHeight + 45;
					};
					// #endif

					// #ifdef MP-WEIXIN
					Vue.prototype.StatusBar = e.statusBarHeight;
					let custom = wx.getMenuButtonBoundingClientRect();
					Vue.prototype.Custom = custom;
					Vue.prototype.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
					// #endif		

					// #ifdef MP-ALIPAY
					Vue.prototype.StatusBar = e.statusBarHeight;
					Vue.prototype.CustomBar = e.statusBarHeight + e.titleBarHeight;
					// #endif
				}
			})




			// 登录 
			var USER_INFO = uni.getStorageSync('USER_INFO');
			var USER_TOKEN = uni.getStorageSync('USER_TOKEN');
			console.log(USER_TOKEN)

			if (USER_INFO) {
				getApp().globalData.conn.open({
					apiUrl: WebIM.config.apiURL,
					// user: __test_account__ || this.name.toLowerCase(),
					// pwd: __test_psword__ || this.psd,
					user: 'heiban' + USER_INFO.id,
					pwd: '123456',
					grant_type: 'password',
					appKey: WebIM.config.appkey
				});
				// 连接未读数量scoket
				// uni.closeSocket();
				this.initializeSocket();
			}
			uni.hideLoading();
			// end----------------- 登录


			// 监听登录
			disp.on('appLoginSuccess', () => {
				console.log('监听登录成功')
				// 连接未读数量scoket
				// uni.closeSocket();
				_this.getRoster();
				_this.getAllUserFun(_this.getChatList());

				_this.initializeSocket();
				disp.fire("chat.history", null);
			})
			// 断开客服重连聊天
			uni.$on('initSuccess', () => {
				console.log('断开客服重连聊天')
				if (global.userInfo) {
					getApp().globalData.conn.open({
						apiUrl: WebIM.config.apiURL,
						// user: __test_account__ || this.name.toLowerCase(),
						// pwd: __test_psword__ || this.psd,
						user: 'heiban' + global.userInfo.id,
						pwd: '123456',
						grant_type: 'password',
						appKey: WebIM.config.appkey
					});
					_this.initializeSocket()

				}
				uni.hideLoading();
			})
			var me = this;
			var logs = uni.getStorageSync("logs") || [];
			logs.unshift(Date.now());
			uni.setStorageSync("logs", logs); //

			// disp.on("em.main.ready", function() {
			// 	calcUnReadSpot();
			// });
			// disp.on("em.chatroom.leave", function() {
			// 	calcUnReadSpot();
			// });
			// disp.on("em.chat.session.remove", function() {
			// 	calcUnReadSpot();
			// });
			// disp.on("em.chat.audio.fileLoaded", function() {
			// 	calcUnReadSpot();
			// });
			// disp.on("em.main.deleteFriend", function() {
			// 	calcUnReadSpot();
			// });
			disp.on("chat.history", function() {
				calcUnReadSpot();
			}); //用户点开聊天记录

			disp.on("message.show", function() {
				_this.getAllUserFun(_this.getChatList());
				_this.setListGroup();
				calcUnReadSpot();
			}); //获取会话列表头像标题	

			disp.on("StarStatusFun", function() {
				_this.StarStatusFun()
			}); //第一次显示app	


			disp.on("em.unreadspot", function(msg) {
				_this.setListGroup()

				if (msg) {
					//待优化
					_this.getRoster();
					// _this.getAllUserFun(_this.getChatList());  //待删除重复了
				}
				if (msg && _this.getItemInfo(null, msg.to, 'is_not_disturb', msg) == 2) {
					uni.vibrateLong();
					console.log("震动")
				}

			}); //给回话列表赋值

			WebIM.conn.listen({
				onOpened(message) {
					console.log('连接成功回调')
					// disp.fire("em.login.status", '连接成功');
					setTimeout(function() {
						uni.switchTab({
							url: '/pages/message/index'
						})
					}, 300)
				},

				onReconnect() {
					uni.showToast({
						title: "重连中...",
						duration: 2000
					});
				},

				onSocketConnected() {
					uni.showToast({
						title: "socket连接成功",
						duration: 2000
					});
				},

				onClosed() {
					console.log('关闭环信socket')
					// uni.redirectTo({
					// 	url: "/pages/login"
					// });
					me.globalData.conn.closed = true;
					WebIM.conn.close();
				},
				onCustomMessage: function(message) {
					console.log('收到自定义消息', message)
					if (message) {
						if (onMessageError(message)) {
							msgStorage.saveReceiveMsg(message, message.contentsType);
						}

						calcUnReadSpot(message);
						ack(message);
					}
				}, //收到自定义消息
				onTextMessage: function(message) {
					console.log('收到文本消息', message)
					if (message) {
						if (onMessageError(message)) {
							msgStorage.saveReceiveMsg(message, message.contentsType);
						}

						calcUnReadSpot(message);
						ack(message);
					}
				}, //收到文本消息
				onContactInvited: function(message) {
					console.log('收到好友邀请', message)
				}, // 收到好友邀请
				onContactDeleted: function(msg) {
					console.log('被删除时回调此方法', msg)
					if (msg.type == 'groupchat') {
						var sessionKey = msg.to + 'heiban' + global.userInfo.id;
						uni.removeStorageSync(sessionKey);
						uni.removeStorageSync("rendered_" + sessionKey);
						disp.fire("chat.history", {});
					} else {
						var sessionKey = msg.to == 'heiban' + global.userInfo.id ? msg.to + msg.from : msg.from + msg.to;
						uni.removeStorageSync(sessionKey);
						uni.removeStorageSync("rendered_" + sessionKey);
						disp.fire("chat.history", {});
					}
					_this.setListGroup();
				}, // 被删除时回调此方法
				onContactAdded: function(message) {
					console.log('增加了联系人时回调此方法', message)
				}, // 增加了联系人时回调此方法
				onContactRefuse: function(message) {
					console.log('好友请求被拒绝', message)
				}, // 好友请求被拒绝
				onContactAgreed: function(message) {
					console.log('好友请求被同意', message)
					_this.getRoster();
				}, // 好友请求被同意
				onRecallMessage: function(message) {
					console.log('收到撤回消息回调', message)
					if (message) {
						msgStorage.withdrawMsg(message);
					}

				}, //收到撤回消息回调
				onReceivedMessage: function(message) {
					console.log('收到消息送达服务器回执')
				}, //收到消息送达服务器回执
				onDeliveredMessage: function(message) {
					console.log('收到消息送达客户端回执')
				}, //收到消息送达客户端回执
				onReadMessage: function(message) {
					console.log('收到消息已读回执')
				}, //收到消息已读回执
				onCreateGroup: function(message) {
					console.log('创建群组成功回执')
				}, //创建群组成功回执（需调用createGroupNew）
				onChannelMessage: function(message) {
					console.log('收到整个会话已读的回执')
				}, //收到整个会话已读的回执，在对方发送channel ack时会在这个回调里收到消息
				// 各种异常
				onError(error) {
					console.log(error, error.type)

					if (error.type == WebIM.statusCode.WEBIM_CONNCTION_OPEN_ERROR) {
						uni.hideLoading();
						disp.fire("em.error.passwordErr");
						// uni.showModal({
						// 	title: "用户名或密码错误",
						// 	confirmText: "OK",
						// 	showCancel: false
						// });
					}

					if (error.type == WebIM.statusCode.WEBIM_CONNCTION_AUTH_ERROR) {
						console.log('WEBIM_CONNCTION_AUTH_ERROR')
						uni.hideLoading();
						disp.fire("em.error.tokenErr");
						uni.redirectTo({
							url: "/pages/login"
						});
						me.globalData.conn.closed = true;
						WebIM.conn.close();
					}
					if (error.type == 16) {
						console.log('error.type == 16 socket断开链接 重新链接')
						uni.closeSocket();
						WebIM.conn.close();
						disp.fire('appLoginSuccess', {
							msg: '重新链接'
						})
					}
					// 	me.globalData.conn.closed = true;
					// 	WebIM.conn.close();
					// 	console.log(error, error.type)
					// }

					if (error.type == "socket_error") {
						///sendMsgError
						console.log("socket_errorsocket_error", error);
						uni.showToast({
							title: "网络已断开",
							icon: "none",
							duration: 2000
						});
						disp.fire("em.error.sendMsgErr", error);
					}
				}
			});
			this.globalData.checkIsIPhoneX();

		},
		onShow: function() {
			var pages = getCurrentPages();
			if (pages.length > 0) {
				var page = (pages[pages.length - 1]).route;
				if (page == "pages/chat/service") return;
			}
			console.log('App Show')
			// disp.fire("appLoginSuccess");
		},
		onHide: function() {
			console.log('App Hide')
			// uni.closeSocket();
			// WebIM.conn.close();
		},
		computed: {
			...mapState({
				AllUserData: (state) => state.message.AllUserData, //消息列表数据
			}),
		},
		methods: {
			...mapMutations(["updataMessageNum", "updataAddFriend", "updataRoomInfo", "updataMsg_list",
				"updataGroupNum", "updatamMssageList", "updataAllUserData","updataStarStatus"
			]),
			StarStatusFun(){
				const {
					updataStarStatus
				} = this;
				updataStarStatus(false)
			},
			// 初始化scoket
			initializeSocket() {
				const {
					updataMessageNum,
					updataAddFriend,
					updataGroupNum
				} = this;
				var _this = this;
				if (global.token) {
					// 链接socket
					uni.connectSocket({
						url: WS_HOST,
						success(res) {
							console.log('连接好友数量和论坛数量socket成功', res)
							_this.getListData();
						}
					})


					// 接收socket消息
					uni.onSocketOpen(res => {
						// sendSocketMessage 通过 WebSocket 连接发送数据
						uni.sendSocketMessage({
							data: JSON.stringify({
								type: 'bind',
								user_id: global.userInfo.id
							})
						})

						// onSocketMessage   监听WebSocket接受到服务器的消息事件
						uni.onSocketMessage(onMessage => {
							var data = JSON.parse(onMessage.data);
							console.log("监听未读数WebSocket", data);
							if (data.type == "apply_add_friend") {
								console.log(data.friend_num)
								// 添加好友推送数量
								updataAddFriend(data.friend_num)
							} else if (data.type == "form_message_num") {
								//论坛socket 消息数量通知
								console.log(data.num)
								updataMessageNum(data.num)

							} else if (data.type == "apply_group_num") {
								console.log(data.apply_num)
								//用户申请入群
								updataGroupNum(data.apply_num)

							}

						})

						// 定时发送心跳消息避免断开
						setInterval(() => {
							uni.sendSocketMessage({
								data: JSON.stringify({
									class: 'ping'
								})
							});
						}, 25000)

					})
					uni.onSocketError(function(res) {
						console.log('WebSocket连接打开失败，请检查！', res);
						// uni.closeSocket();
						// this.initializeSocket();
					});

				}
			},
			// 获取列表数据
			getListData() {
				let _this = this;
				this.$api.post(global.apiUrls.chat_list).then(res => {
					var res = res.data;
					if (res.code == 1) {
						console.log('获取未读数量socket')
					} else {
						console.log('获取未读数量socket')
					}
				})
			},
			//根据id获取会话列表的详情
			getItemInfo(nulla, index, key, item) {
				var AllUserData = this.AllUserData;
				var userinfo = AllUserData.find(function(a) {
					var itemD = item.to == 'heiban' + global.userInfo.id ? item.from : item.to;
					return a.to == itemD
				})
				if (userinfo) {
					return userinfo[key];
				} else {
					return ""
				}
			},
			// 给会话列表赋值
			setListGroup() {
				const {
					updatamMssageList
				} = this;
				updatamMssageList(this.getChatList());
			},
			// 获取好友列表
			getRoster() {
				const {
					updatamMssageList
				} = this;

				let me = this;
				let rosters = {
					success(roster) {
						var member = [];

						for (let i = 0; i < roster.length; i++) {
							if (roster[i].subscription == "both") {
								member.push(roster[i]);
							}
						}

						uni.setStorage({
							key: "member",
							data: member
						});
						me.setData({
							member: member
						});
						me.listGroups();
					},

					error(err) {
						console.log(err);
					}

				};
				WebIM.conn.getRoster(rosters);
			},
			listGroups() {
				const {
					updatamMssageList
				} = this;
				var me = this;
				return WebIM.conn.getGroup({
					limit: 50,
					success: function(res) {
						uni.setStorage({
							key: "listGroup",
							data: res.data
						});
						updatamMssageList(me.getChatList());
						me.getAllUserFun(me.getChatList());
					},
					error: function(err) {
						console.log(err);
					}
				});
			},
			add0(m) {
				return m < 10 ? '0' + m : m
			},
			// 获取会话列表
			getChatList() {
				const {
					add0
				} = this;
				var array = [];
				var member = uni.getStorageSync("member");
				var userInfo = uni.getStorageSync("USER_INFO");
				var myName = 'heiban' + userInfo.id;
				var listGroups = uni.getStorageSync('listGroup') || [];

				for (let i = 0; i < member.length; i++) {
					let newChatMsgs = uni.getStorageSync(myName + member[i].name) || [];
					let historyChatMsgs = uni.getStorageSync("rendered_" + myName + member[i].name) || [];
					let curChatMsgs = historyChatMsgs.concat(newChatMsgs);
					if (curChatMsgs.length) {
						let lastChatMsg = curChatMsgs[curChatMsgs.length - 1];
						lastChatMsg.unReadCount = newChatMsgs.length;

						if (lastChatMsg.unReadCount > 99) {
							lastChatMsg.unReadCount = "99+";
						}
						let dat = new Date();
						dat.setTime(lastChatMsg.time);
						let y = dat.getFullYear(); //年
						let m = dat.getMonth() + 1; //月
						let d = dat.getDate(); //日
						let h = dat.getHours(); //时
						let mm = dat.getMinutes(); //分
						let ss = dat.getSeconds(); //分
						lastChatMsg.time = `${y}-${add0(m)}-${add0(d)} ${add0(h)}:${add0(mm)}:${add0(ss)}`;
						let dateArr = lastChatMsg.time.split(' ')[0].split('-');
						let timeArr = lastChatMsg.time.split(' ')[1].split(':');
						let month = dateArr[2] < 10 ? '0' + dateArr[2] : dateArr[2];
						lastChatMsg.dateTimeNum = `${dateArr[1]}${month}${timeArr[0]}${timeArr[1]}${timeArr[2]}`;
						lastChatMsg.time = `${dateArr[1]}月${dateArr[2]}日 ${timeArr[0]}时${timeArr[1]}分`;
						array.push(lastChatMsg);
					}
				}

				for (let i = 0; i < listGroups.length; i++) {
					let newChatMsgs = uni.getStorageSync(listGroups[i].groupid + myName) || [];
					let historyChatMsgs = uni.getStorageSync("rendered_" + listGroups[i].groupid + myName) || [];
					let curChatMsgs = historyChatMsgs.concat(newChatMsgs);
					if (curChatMsgs.length) {
						let lastChatMsg = curChatMsgs[curChatMsgs.length - 1];
						lastChatMsg.unReadCount = newChatMsgs.length;
						if (lastChatMsg.unReadCount > 99) {
							lastChatMsg.unReadCount = "99+";
						}
						let dat = new Date();
						dat.setTime(lastChatMsg.time);
						let y = dat.getFullYear(); //年
						let m = dat.getMonth() + 1; //月
						let d = dat.getDate(); //日
						let h = dat.getHours(); //时
						let mm = dat.getMinutes(); //分
						let ss = dat.getSeconds(); //分
						lastChatMsg.time = `${y}-${add0(m)}-${add0(d)} ${add0(h)}:${add0(mm)}:${add0(ss)}`;
						let dateArr = lastChatMsg.time.split(' ')[0].split('-')
						let timeArr = lastChatMsg.time.split(' ')[1].split(':')
						let month = dateArr[2] < 10 ? '0' + dateArr[2] : dateArr[2]
						lastChatMsg.time = `${dateArr[1]}月${dateArr[2]}日 ${timeArr[0]}时${timeArr[1]}分`
						lastChatMsg.dateTimeNum = `${dateArr[1]}${month}${timeArr[0]}${timeArr[1]}${timeArr[2]}`
						lastChatMsg.groupName = listGroups[i].groupname
						array.push(lastChatMsg);
					}
				}

				array.sort((a, b) => {
					return b.dateTimeNum - a.dateTimeNum;
				});
				return array;
			},
			// 获取用户和群组信息
			getAllUserFun(data) {
				const {
					updataAllUserData,
					updatamMssageList
				} = this;
				var userInfo = global.userInfo;
				var info = [];
				for (var i = 0; i < data.length; i++) {
					var obj = {
						to: data[i].to == 'heiban' + userInfo.id ? data[i].from : data[i].to,
						type: data[i].type.toLowerCase()
					}
					info.push(obj)
				}
				var infoStr = JSON.stringify(info);
				let _this = this;
				this.$api.post(global.apiUrls.disposeHuanxin, {
					data: infoStr
				}).then(res => {
					var res = res.data;
					if (res.code == 1) {
						console.log('获取最新会话列表信息', res.data)
						updataAllUserData(res.data);
						// updatamMssageList(_this.AllUserData);
					} else {
						_this.$message.info(res.msg)
					}
				})
			},
		}
	}
</script>
<style lang="less">
	/*每个页面公共css */
	@import "common/css/main.css";
	@import "common/css/icon.css";

	.text-theme {
		color: #845210;
	}

	.text-blu {
		color: #00A9FC
	}

	.text-blu1 {
		color: #0093FF
	}

	.text-333 {
		color: #333333;
	}

	.text-666 {
		color: #666666;
	}

	.text-999 {
		color: #999999 !important;
	}

	.text-225 {
		color: #225DAD;
	}

	.text-8080 {
		color: #808080;
	}

	.text-break {
		word-wrap: break-word;
		word-break: break-all;
	}

	.text-normal {
		white-space: normal;
	}

	.bg-blu {
		background-color: #00A9FC !important;
		color: #FFFFFF;
	}

	.bg-eded {
		background-color: #EDEDED;
	}

	.bg-f7f7 {
		background-color: #F7F7F7;
	}

	.bg-f6f6 {
		background-color: #F6F6F6;
	}

	.bg-f2f2 {
		background-color: #F2f2f2;
	}

	.bg-eee {
		background-color: #EEEEEE !important;
	}

	.bg-e1e1 {
		background-color: #E1E1E1;
	}

	.bg-rgba {
		background-color: rgba(255, 255, 255, .8);
	}

	.bg-dcdc {
		background-color: #DCDCDC
	}

	.bg-999 {
		background-color: #999999;
	}

	.bg-theme {
		background-color: #0093FF;
		color: #FFFFFF;
	}

	.p-lr-0 {
		padding-left: 0;
		padding-right: 0;
	}

	.p-0 {
		padding: 0 !important;
	}

	.mt-0 {
		margin-top: 0 !important;
	}

	.pb-0 {
		padding-bottom: 0;
	}

	.pt-100 {
		padding-top: 100rpx;
	}

	.flex-shrink {
		flex-shrink: 0;
	}

	.visibility {
		visibility: hidden;
	}

	.text-cut2 {
		overflow: hidden;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		display: -webkit-box;
		// 数字字母不换行问题
		word-wrap: break-word;
		word-break: normal;
	}

	.text-cut3 {
		overflow: hidden;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		display: -webkit-box;
		// 数字字母不换行问题
		word-wrap: break-word;
		word-break: normal;
	}
	.text-normal {
		word-wrap: break-word;
		word-break: normal;
	}

	.right-icon {
		width: 14rpx;
		height: 24rpx;
	}

	.user-img {
		border-radius: 6rpx;
	}

	.w-100 {
		width: 100%;
	}

	.h-100 {
		height: 100%;
	}

	.relative {
		position: relative;
	}

	.overflow {
		overflow: hidden;
	}

	.overflow-y-auto {
		overflow-y: auto;
	}

	/* 搜索按钮大小 */
	.search-inp {
		text {
			font-size: 30rpx;
		}
	}

	/* 搜索栏 */
	.fixed-top {
		position: fixed;
		width: 100%;
		z-index: 1000;
	}

	/* mask */
	.mask {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 900;
		background-color: rgba(0, 0, 0, .6);
	}

	/* 模态框 */
	.modalName {
		border-radius: 24rpx 24rpx 0px 0px !important;

		.item {
			height: 110rpx;
			line-height: 110rpx;
		}
	}

	.bottom-modal .bg-white {
		color: #333333;
	}

	.text-40 {
		font-size: 40rpx;
	}

	.uni-dialog-title {
		color: #333333 !important;
	}

	.uni-dialog-title .uni-popup__info {
		color: #333333 !important;
	}
</style>
