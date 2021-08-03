<template>
	<view class="">
		<cu-custom bgColor="bg-eded text-xl" :isBack="false">
			<block slot="content"><text class="text-lg">消息</text><text class="text-df" v-if="msg_num>0">({{msg_num}})</text></block>
			<block slot="right">
				<view class="text-right w-100 padding-right text-black head">
					<text class="cuIcon-search lg margin-right-sm text-40" @click="handleJump" data-url="/pages/message/search"></text>
					<text class="cuIcon-roundadd lg text-40" @click="more_select = !more_select"></text>
					<view class="select" v-show="more_select" @click.stop="more_select = false">
						<view class="select-row border" @click="onScanCode">
							<image src="/static/ye_icon/scan.png" mode=""></image>
							<text>扫一扫</text>
						</view>
						<view class="select-row border" @click="handleJump($event)" data-url="/pages/addressList/addFriend">
							<image src="/static/ye_icon/add_friend.png" mode=""></image>
							<text>添加朋友</text>
						</view>
						<view class="select-row" @click="handleJump($event)" data-url="/pages/chat/service">
							<image src="/static/ye_icon/say.png" mode=""></image>
							<text>客服</text>
						</view>
					</view>
				</view>
			</block>
		</cu-custom>

		<view class="content" v-if="listData.length>0">
			<view class="cu-list menu-avatar">
				<view class="cu-item" :class="modalName=='move-box-'+ index?'move-cur':''" v-for="(item,index) in listData" :key="index"
				 @touchstart="ListTouchStart" @touchmove="ListTouchMove" @touchend="ListTouchEnd" :data-target="'move-box-' + index"
				 @click="handleJump" :data-url="`/pages/chat/chat?id=${getItemInfo(AllUserData,item.to,item.from,'to_id')}&type=${item.type=='chat'?1:2}&title=${getItemInfo(AllUserData,item.to,item.from,'group_title')}&group_id=${item.to}&head_img=${getItemInfo(AllUserData,item.to,item.from,'thumb')}`">
					<view class="cu-avatar user-img">
						<u-image :src="getItemInfo(AllUserData,item.to,item.from,'thumb')" mode="aspectFill" width="94rpx" height="94rpx"
						 border-radius="8rpx" :lazy-load="true"></u-image>
						<view class="cu-tag badge" :class="getItemInfo(AllUserData,item.to,item.from,'is_not_disturb')==1?'bg-999':''"
						 v-if="item.unReadCount>0">{{item.unReadCount>99?'99+':item.unReadCount}}</view>
					</view>
					<view class="content">
						<view class="text-df text-black text-cut">{{getItemInfo(AllUserData,item.to,item.from,'group_title')}}</view>
						<view class="text-gray text-sm text-cut" v-if="item.contentsType=='TEXT'">{{item.data}}</view>
						<view class="text-gray text-sm text-cut" v-else-if="item.customEvent=='toast'">{{item.customExts.text}}</view>
						<view class="text-gray text-sm text-cut" v-else-if="item.customEvent=='image'">图片</view>
						<view class="text-gray text-sm text-cut" v-else>语音</view>
					</view>
					<view class="action">
						<view class="text-gray text-sm">{{item.time}}</view>
						<view class="text-gray text-xs visibility">22:20</view>
					</view>
					<view class="move" @click.stop="chatDelete(item)">
						<view class="bg-red">删除</view>
					</view>
				</view>
			</view>
		</view>
		<view class="padding-xl text-center text-666 solid-top-f7" v-else>你还没有好友聊天~</view>

		<!-- 弹出遮盖层 -->
		<view class="mask mask1" v-show="more_select" @click="more_select = !more_select"></view>
		<!-- 断网提示 -->
		<fu-notwork></fu-notwork>
	</view>
</template>

<script>
	var timer = null;
	// 环信
	let WebIM = require("../../utils/WebIM")["default"];
	let disp = require("../../utils/broadcast");
	import {
		mapState,
		mapMutations
	} from "vuex";
	export default {
		data() {
			return {
				modalName: null, //当前所滑动的盒子
				more_select: false, // 头部导航 右边加号
				userInfo: global.userInfo,
				msg_num: 0, //消息总数
				member: [], //好友列表
				arr: [], //会话列表
				AllUserData: [], //会话列表信息
				loginStu: false
			}
		},
		onShow() {
			var _this = this;
			const {
				updatamMssageList
			} = this;
			// 更新会话列表
			if (this.loginStu) {
				this.getRoster();
				disp.fire("chat.history", {});
			}
			// setTimeout(function() {
			// 	_this.getRoster();
			// 	disp.fire("chat.history", {});
			// }, 50)
		},
		onLoad() {
			if (!global.userInfo) return uni.navigateTo({
				url: "/pages/login"
			})
			var _this = this;
			const {
				updatamMssageList
			} = this;
			//监听退出
			disp.on("exitDisp", function(message){
				disp.off("em.login.status",_this.loginSuccessFun())
			})
			//监听未读消息数
			disp.on("em.login.status", _this.loginSuccessFun()); //监听未读加群“通知”

			//监听未读消息数
			disp.on("em.unreadspot", function(message) {
				console.log('监听更新未读数和列表-----------------------------------------------', message)
				_this.getRoster();
				// 更新会话列表
				updatamMssageList(_this.getChatList());
				// 获取会话列表信
				_this.getAllUser(_this.getChatList());
				if (message && _this.getItemInfo(_this.AllUserData, message.to, message.from, 'is_not_disturb') == 2) {
					if (timer) {
						clearTimeout(timer)
					}
					timer = setTimeout(function() {
						uni.vibrateLong();
					}, 300)
					console.log("震动")
				}
			}); //监听未读加群“通知”

		},
		// 监听页面卸载
		onUnload() {},
		computed: {
			...mapState({
				listData: (state) => state.message.messageList, //消息列表数据
			}),
		},
		methods: {
			...mapMutations(['updatamMssageList']),
			loginSuccessFun(message) {
				this.loginStu = true;
				console.log('登录成功获取会话列表数据------------------------------------------------')
				// _this.getRoster();
				// // 更新会话列表
				// updatamMssageList(_this.getChatList());
				// // 获取会话列表信
				// _this.getAllUser(_this.getChatList());
				// disp.fire("chat.history", {});
			},
			//根据id获取会话列表的详情
			getItemInfo(AllUserData, id, fromid, key) {
				var idc = id == 'heiban' + this.userInfo.id ? fromid : id;
				var userinfo = AllUserData.find(function(a) {
					return a.to == idc
				})
				if (userinfo) {
					return userinfo[key];
				} else {
					return ""
				}
			},
			// 获取用户和群组信息
			getAllUser(data) {
				var userInfo = this.userInfo;
				var info = [];
				for (var i = 0; i < data.length; i++) {
					var obj = {
						to: data[i].to == 'heiban' + userInfo.id ? data[i].from : data[i].to,
						type: data[i].type
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
						console.log(888888888888888888888888888888888, res.data)
						_this.AllUserData = res.data;
						_this.$forceUpdate();
					} else {
						_this.$message.info(res.msg)
					}
				})
			},
			// 获取列表数据
			getListData() {
				let _this = this;
				this.$api.post(global.apiUrls.chat_list).then(res => {
					var res = res.data;
					if (res.code == 1) {
						console.log('获取未读数量socket111111111111111111111')
					} else {
						console.log('获取未读数量socket111111111111111111111111')
					}
				})
			},
			// 删除列表消息
			chatDelete(data) {
				console.log(data)
				if (data.type == 'groupchat') {
					var sessionKey = data.to + 'heiban' + this.userInfo.id;
					uni.removeStorageSync(sessionKey);
					uni.removeStorageSync("rendered_" + sessionKey);
					disp.fire("chat.history", {});
				} else {
					var sessionKey = data.to == 'heiban' + this.userInfo.id ? data.to + data.from : data.from + data.to;
					uni.removeStorageSync(sessionKey);
					uni.removeStorageSync("rendered_" + sessionKey);
					disp.fire("chat.history", {});
				}
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
						// 更新会话列表
						// updatamMssageList(me.getChatList());
						// me.getAllUser(me.listData);
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
			// 扫一扫
			onScanCode() {
				uni.scanCode({
					success: res => {
						this.more_select = false;
						console.log(res);
						var ind = res.result.indexOf("?");
						if (ind == -1) return this.$message.info("请扫正确的二维码");
						var url = res.result.split("?");
						url = url[1].split("=");
						var id = url[1];
						if (url[0] == "group_id") {
							uni.navigateTo({
								url: `/pages/friendData/groupDetails?id=${id}&is_join=1`
							});
						} else if (url[0] == "user_id") {
							uni.navigateTo({
								url: `/pages/friendData/friendData?id=${id}`
							});
						} else {
							this.$message.info("请扫正确的二维码")
						}
					}
				});
			},
			// ListTouch触摸开始
			ListTouchStart(e) {
				this.listTouchStart = e.touches[0].pageX
			},

			// ListTouch计算方向
			ListTouchMove(e) {
				this.listTouchDirection = e.touches[0].pageX - this.listTouchStart > 0 ? 'right' : 'left'
			},

			// ListTouch计算滚动
			ListTouchEnd(e) {
				if (this.listTouchDirection == 'left') {
					this.modalName = e.currentTarget.dataset.target
				} else {
					this.modalName = null
				}
				this.listTouchDirection = null
			}
		}
	}
</script>

<style lang="less" scoped>
	.user-img {
		display: block;
		width: 94rpx;
		height: 94rpx;
		border-radius: 8rpx;
	}

	.solid-top-f7 {
		border-top: 1px solid #EEEEEE;
	}

	.cu-list .cu-item {
		height: 158rpx;
	}

	.cu-list>.cu-item .move {
		width: 130rpx;
	}

	.cu-list>.cu-item.move-cur {
		transform: translateX(-130rpx);
	}

	.cu-list.menu-avatar>.cu-item .action {
		padding-right: 32rpx;
		width: 250rpx;
		text-align: right;
	}

	.cu-list .content {
		view:first-child {
			width: 300rpx;
		}
	}

	.mask1 {
		background-color: rgba(0, 0, 0, 0);
	}

	// 更多
	.head {
		position: relative;

		.select {
			position: absolute;
			top: 60upx;
			right: 8upx;
			background-image: url(../../static/ye_icon/more_back.png);
			background-size: 100% 100%;
			width: 261upx;
			height: 324upx;
			z-index: 1;


			.select-row {
				display: flex;
				height: 104upx;
				align-items: center;
				position: relative;

				&:nth-child(1) {
					margin-top: 10upx;
				}

				image {
					width: 32rpx;
					height: 32rpx;
					margin-left: 32upx;
					margin-right: 20upx;
				}

				text {
					height: 40upx;
					font-size: 28upx;
					font-family: PingFang SC;
					font-weight: 400;
					line-height: 40upx;
					color: #ffffff;
				}

				&.border::after {
					position: absolute;
					right: 0;
					bottom: 0;
					left: 85upx;
					height: 2px;
					content: '';
					-webkit-transform: scaleY(0.5);
					transform: scaleY(0.5);
					background-color: #5a5a5a;
				}
			}
		}
	}
</style>
