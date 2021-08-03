<template>
	<view class="chat-box" @click.stop="boxClick">
		<scroll-view scroll-view class="cbc-scrool" :scroll-y="true" :scroll-into-view="scrollIntoView" :scroll-top="scrollTop"
		 @scrolltoupper="getLists" @touchstart="touchstartFun" @touchend="touchendFun" @scrolltolower="scrolltolowerFun"
		 :upper-threshold="100" :lower-threshold="100" :style="{bottom: (showFace ? '500rpx' : showMore ? '320rpx' : '100rpx')}">
			<view id="scrollview" class="chat-box">
				<view class="padding-xl text-center text-black" v-if="loadingStatus && !pages">
					加载中...
				</view>
				<block v-for="(item,index) in msg_list" :key='index'>
					<view :id="`item${item.id}`" class="cb-main">
						<view class="chat-time" v-if="filterLable(item.time,msg_list,index-1)">
							<text>{{filterLable(item.time,msg_list,index-1)}}</text>
						</view>
						<!-- <view class="chat-time" v-if="!msg_list[index+1]">
							<text>{{item.sendtime}}</text>
						</view> -->

						<!-- 自己说的话start -->
						<view v-if="item.from=='heiban'+userInfo.id && item.customEvent!='toast' && item.customEvent!='oneChat'" class="chat-row me">
							<view class="chat-img" @tap="handleJump" :data-url="'/pages/friendData/friendData?id='+userInfo.id">
								<image :src="userInfo.head_img" mode=""></image>
							</view>
							<view class="chat-txt" :class="item.customEvent=='image' ? 'no_bj' : item.customEvent=='audio'?'voice_box':''"
							 @click.stop="playRecord(item)" @longpress.stop="longpressFun($event,item)">
								<!-- <text selectable="true"></text> -->
								<view v-if="item.contentsType == 'TEXT'" v-html='replaceEmoji(item.data)' :hover-stop-propagation="false"></view>
								<image v-if="item.contentsType == 'CUSTOM' && item.customEvent=='image'" @tap='previewImg(item.customExts.url)'
								 class="chatImage" :src="item.customExts.url" mode="heightFix"></image>
								<image v-if="item.contentsType == 'CUSTOM' && item.customEvent=='audio' && !item.typeplay" class="record" src="@/static/xs_icon/record_left.png"
								 mode="widthFix"></image>
								<image v-if="item.contentsType == 'CUSTOM' && item.customEvent=='audio' && item.typeplay==true" class="record"
								 src="@/static/xs_icon/recordimg_left.gif" mode="widthFix"></image>
								<text v-if="item.contentsType == 'CUSTOM' && item.customEvent=='audio'" :style="`padding-left: ${item.customExts.duration*4}px;`"
								 class="time">{{item.customExts.duration || ''}}</text>
								<!-- <text>{{item.sound_num}}</text> -->
							</view>
							<!-- 长按出现复制删除撤回 -->
							<view class="operationBox flex justify-end left" v-show="operation && item.id==operation.id" style="left: -80rpx;top: -70rpx;">
								<view class="operation flex align-center justify-center text-center">
									<view class="flex-sub solid-right" v-if="item.contentsType=='TEXT'" @click.stop="copyText(item.data)"> 复制
										{{item.offsetLeft}}</view>
									<view class="flex-sub solid-right" @click.stop="deleteMsg(item.id,item)"> 删除 </view>
									<view class="flex-sub" @click.stop="withdrawMsg(item.id,item.to)"> 撤回 </view>
								</view>
							</view>
						</view>
						<!-- 自己说的话end -->
						<!-- 他人说的话start -->
						<view v-else-if="item.customEvent!='toast' && item.customEvent!='oneChat'" class="chat-row">
							<view class="chat-img">
								<image :src="roomData.head_img || groupHead(item.ext.userid)" mode="" @tap="handleJump" :data-url="'/pages/friendData/friendData?id='+item.ext.userid+'&close=1'"></image>
							</view>
							<view class="cr-box">
								<!-- 他人名字 -->
								<view class="crb-name" v-if="roomData.type==2">
									{{item.nickname || groupName(item.ext.userid)}}
								</view>
								<view @click.stop='playRecord(item)' class="chat-txt" :class="item.customEvent=='image' ? 'no_bj' : item.customEvent=='audio'?'voice_box':''"
								 @longpress="longpressFun($event,item)">
									<text v-if="item.contentsType == 'TEXT'" v-html='replaceEmoji(item.data)'></text>
									<image v-if="item.contentsType == 'CUSTOM' && item.customEvent=='image'" @tap='previewImg(item.customExts.url)'
									 class="chatImage" :src="item.customExts.url" mode="heightFix"></image>
									<image v-if="item.contentsType == 'CUSTOM' && item.customEvent=='audio' && !item.typeplay" class="record" src="@/static/xs_icon/record_left.png"
									 mode="widthFix"></image>
									<image v-if="item.contentsType == 'CUSTOM' && item.customEvent=='audio' && item.typeplay" class="record" src="@/static/xs_icon/recordimg_left.gif"
									 mode="widthFix"></image>
									<text v-if="item.contentsType == 'CUSTOM' && item.customEvent=='audio'" class="time" :style="`padding-left: ${item.customExts.duration*4}px;`">{{item.customExts.duration || ''}}</text>
									<!-- <text>{{item.sound_num}}</text> -->
								</view>

							</view>
							<!-- 长按出现复制删除撤回 -->
							<view class="operationBox flex justify-start right" v-show="operation && item.id==operation.id" style="right: -80rpx;top: -70rpx;">
								<view class="operation operation1 flex align-center justify-center text-center">
									<view class="flex-sub solid-right" v-if="item.contentsType=='TEXT'" @click.stop="copyText(item.data)"> 复制
										{{item.offsetLeft}}</view>
									<view class="flex-sub" @click.stop="deleteMsg(item.id,item)"> 删除 </view>
									<!-- <view class="flex-sub"> 撤回 </view> -->
								</view>
							</view>
						</view>
						<!-- 他人说的话end -->
						<!-- 撤回消息 -->
						<view class="system" v-else-if="item.contentsType == 'CUSTOM' && item.customEvent=='toast'">
							<text v-if="roomData.type==1">{{item.ext.userid==userInfo.id?'我撤回消息':'对方撤回消息'}}</text>
							<text v-else-if="roomData.type==2 && item.ext.userid==userInfo.id">{{'我撤回消息'}}</text>
							<text v-else>{{groupName(item.ext.userid)+'撤回消息'}}</text>
						</view>
						<!-- 撤回消息end -->
						<!-- 系统消息 -->
						<view class="system" v-else-if="item.contentsType == 'CUSTOM' && item.customEvent=='oneChat'">
							<text>{{item.customExts.text}}</text>
						</view>
						<!-- 系统消息end -->
						<!-- 系统消息 -->
						<view class="system" v-else>
							<text>{{item.content}}</text>
						</view>
						<!-- 系统消息end -->
					</view>
				</block>
				<view class="padding-bottom-xs visibility" id="items999">0</view>
			</view>

		</scroll-view>

		<!-- <view class="recordPop"> -->
		<view class="recordPop" v-if="record">
			<view class="rp-main">
				<image src="/static/xs_icon/record.png" mode=""></image>
				<view class="rpm-text">
					{{cancelRecord?'取消发送':'上滑取消'}}
				</view>
			</view>
		</view>

		<!-- </view> -->
		<view class="bottom bottom-prohibit" v-if="roomInfo.is_status == 2 || roomInfo.is_black == 1">
			<!-- <button class="prohibit" type="default">禁言</button> -->
			<view class="prohibit">
				{{roomInfo.is_status == 2?'禁言中':'已被对方拉黑'}}
			</view>
		</view>
		<view class="bottom" :style="{bottom: (showFace ? '400rpx' : showMore ? '220rpx' : 0)}" v-else>
			<image src="/static/ye_icon/3608.png" mode="" @tap="upload_sound"></image>
			<button @touchstart="recordStart" @touchmove="recordMove" @touchend="recordEnd" class="input" type="default" v-if="soundRecord">按住
				说话</button>
			<input v-else type="text" :focus="inputfocus" v-model="messageContent" @confirm="sendMsg(1,'',messageContent.trim(),onSendMessage)"
			 confirm-type="send" maxlength="500" @click.stop />
			<image src="/static/ye_icon/3607.png" mode="" @click.stop="handleToggleFace"></image>
			<image v-if="showFace == false" src="/static/ye_icon/3606.png" mode="" @click.stop="handleToggleMore"></image>
			<text v-else-if="showFace" @click="onSendMessage(1,'',messageContent.trim())">发送</text>
		</view>


		<!-- 表情包 -->
		<view class="face-box-wapper" v-show="showFace">
			<!-- <view class="face-box-mask" @touchmove.stop.prevent @tap="handleToggleFace"></view> -->
			<scroll-view class="face-box" scroll-y>
				<image @click.stop="handleTapFace(item.name)" v-for="item,index in faceImage" :key="index" :data-name="index+1"
				 class="avatar" mode="aspectFill" :src="item.image"></image>
			</scroll-view>
			<view class="delete-box" @click.stop="onDelete()">
				<image class="delete" src="/static/xs_icon/delete.png" mode=""></image>
			</view>
		</view>
		<!-- 表情包 -->

		<!-- 更多功能 -->
		<view class="face-box-wapper more" v-show="showMore">
			<!-- <view class="face-box-mask" @touchmove.stop.prevent @tap="handleToggleMore"></view> -->
			<view class="more-box">
				<!-- #ifdef APP-PLUS -->
				<view class="item" @click.stop="handleChooseImage('camera')">
					<image src="/static/ye_icon/3599.png"></image>
					<view class="name">拍照</view>
				</view>
				<!-- #endif -->
				<view class="item" @click.stop="handleChooseImage('album')">
					<image src="/static/ye_icon/3594.png"></image>
					<view class="name">照片</view>
				</view>
			</view>
		</view>
		<!-- 遮罩层避免闪一下 -->
		<view class="fixedBox flex align-center justify-center" v-if="loadingBox">
			<text class="cu-load text-gray loading"></text>
		</view>
	</view>
</template>

<script>
	var timer = null;
	import face from '@/static/face.json';
	import {
		UploadImage,
		UploadFileToOSS,
		throttle
	} from '@/common/utils/index';
	import {
		mapState,
		mapMutations
	} from 'vuex';
	import {
		API_BASE_URL
	} from '@/common/config.js';
	const {
		windowHeight,
		statusBarHeight
	} = uni.getSystemInfoSync()
	const recorderManager = uni.getRecorderManager(); //  录音功能
	const innerAudioContext = uni.createInnerAudioContext(); // 播放录音
	// #ifdef APP-PLUS
	// import permision from "@/common/permission.js"
	import permision from "@/common/wa-permission/permission.js"
	// #endif

	// 环信
	let WebIM = require("../../utils/WebIM")["default"];
	let disp = require("../../utils/broadcast");
	//存储聊天记录 
	let msgStorage = require("../../comps/chat/msgstorage");
	export default {
		data() {
			let scrollViewHeight = windowHeight - uni.upx2px(100)
			// #ifdef H5
			scrollViewHeight = windowHeight - uni.upx2px(100) - uni.upx2px(88)
			// #endif
			return {


				soundRecord: false, // 录音按钮显示
				playSound: false, // 录音播放状态
				inputfocus: false, // 输入框聚焦
				record: false, // 开始录音
				scrollTop: 0, // 聊天框 滚动条
				keyboardHeight: 0, // 键盘高度
				compatible: 0, // 兼容表情 和 键盘遮盖
				toUpdate: 0, // 利用时间 绑定 key 刷新
				from_id: 11, //自己的用户id
				showFace: false, //更多表情弹窗
				showMore: false, //更多功能弹窗
				scrollViewHeight: scrollViewHeight, //初始化scroll高度
				faceImage: face,
				/**
				 * contentsType 信息类型  1=文字信息 2=图片信息 3=语音 
				 * */
				say_list: [],
				// xs
				page: 1,
				chat_type: '', // chat_type  类型 1 单聊    2 群聊
				to_id: '', // 对方的id
				rooom_id: '', // 群聊房间id
				roomName: '',

				lord: '', // 群主id
				roomInfo: {},
				redInfo: {
					content: {
						intro: '',
						source: '',
						total_money: ''
					}
				},

				// 1/20 zme
				userInfo: global.userInfo, //用户信息
				messageContent: '', // 消息
				pages: false, //聊天记录分页
				scrollIntoView: '', //scroll滚动位置
				duration: 0, // 发送语音的时长
				durationState: false, // 录音计时状态
				initPoint: 0, //点击录音记录当前位置
				touchesY: 0, //滑动距离
				cancelRecord: false, // 取消发送
				operation: "", //弹出操作栏的数据
				sendStatus: true, //发送状态
				loadingBox: true, //加载盒子
				loadingStatus: false, //顶部加载中
				starScroll: 0, //starScrollFun
				__visibility__: false, //是否在当前页面
				AllUserData: [], //群内所有成员


			};
		},
		computed: mapState({
			roomData: state => state.chat.roomInfo, //聊天ID 消息列表获得 聊天类型 类型:1好友，2群聊  房间id  对方id
			msg_list: state => state.chat.msg_list, //单聊或群聊聊天记录
			filterLable: function() {
				return function(value, msg_list, index) {
					var value1 = 0;
					if (index > 0) {
						msg_list[index]
						value1 = msg_list[index].time;
					}
					let data = new Date();
					let now = data.getTime();
					let time = (now - value) / 1000 / 60;
					let time1 = (now - value1) / 1000 / 60;
					let timeStr = "";
					let timeStr1 = "";
					if (time <= 1) {
						timeStr = "刚刚";
					} else if (time <= 2) {
						timeStr = "1分钟前";
					} else if (time <= 3) {
						timeStr = "2分钟前";
					} else if (time <= 4) {
						timeStr = "3分钟前";
					} else if (time <= 5) {
						timeStr = "4分钟前";
					} else if (time <= 6) {
						timeStr = "5分钟前";
					} else {
						let dat = new Date();
						dat.setTime(value);
						// let y = dat.getFullYear(); //年
						let m = dat.getMonth(); //月
						let d = dat.getDate(); //日
						let h = dat.getHours(); //时
						let mm = dat.getMinutes(); //分

						if (h < 10) h = '0' + h;
						if (mm < 10) mm = '0' + mm;

						timeStr = `${m+1}月${d}日 ${h}:${mm}`;
					}
					if (time1 <= 1) {
						timeStr1 = "刚刚";
					} else if (time1 <= 2) {
						timeStr1 = "1分钟前";
					} else if (time1 <= 3) {
						timeStr1 = "2分钟前";
					} else if (time1 <= 4) {
						timeStr1 = "3分钟前";
					} else if (time1 <= 5) {
						timeStr1 = "4分钟前";
					} else if (time1 <= 6) {
						timeStr1 = "5分钟前";
					} else {
						let dat1 = new Date();
						dat1.setTime(value1);
						let m1 = dat1.getMonth(); //月
						let d1 = dat1.getDate(); //日
						let h1 = dat1.getHours(); //时
						let mm1 = dat1.getMinutes(); //分
						if (h1 < 10) h1 = '0' + h1;
						if (mm1 < 10) mm1 = '0' + mm1;
						timeStr1 = `${m1+1}月${d1}日 ${h1}:${mm1}`;
					}
					if (timeStr == timeStr1) return "";
					return timeStr;
				}
			}
		}),
		// filters: {
		//   groupName: function (value) {

		//   },
		//   groupHead:function (value) {

		//   }
		// }
		onLoad(e) {
			this.showMore = false; //更多表情弹窗
			this.showFace = false; //更多功能弹窗
			// 动态设置标题
			uni.setNavigationBarTitle({
				title: e.title
			})
			// 修改vuex房间信息
			if (e.type == 1) {
				this.updataRoomInfoFun(e.type, e.id, e.head_img)
			} else if (e.type == 2) {
				this.updataRoomInfoFun(e.type, e.id, e.group_id)
			}


			// 监听键盘高度
			uni.onKeyboardHeightChange(res => {
				console.log(res.height)

				this.keyboardHeight = res.height;
				// if (res.height != 0) {
				// 	this.showFace = false;
				// 	this.showMore = false;
				// 	this.inputfocus = true;
				// }
			})
			// 获取聊天记录
			this.getListData(this.roomData.id);
			// 所有群成员的信息
			this.getAllUser();

		},
		onShow() {
			// 所有群成员的信息
			this.getAllUser();
			setTimeout(()=>{
				console.log(JSON.stringify(this.msg_list))
				console.log(JSON.stringify(this.global.userInfo))
			},2000)
		},
		// 监听页面卸载
		onUnload() {
			// 初始化聊天记录列表
			this.initMsgList();
			disp.fire("message.show", {});
		},
		mounted() {
			// 判断是否是当前会话页并更新
			msgStorage.on("newChatMsg", this.dispMsg);
			msgStorage.on("em.withdrawMsg", this.oppwithdrawMsg);
		},
		beforeMount() {
			this.__visibility__ = true;
		},
		destroyed() {
			this.__visibility__ = false;
			msgStorage.off("newChatMsg", this.dispMsg)
			msgStorage.off("em.withdrawMsg", this.oppwithdrawMsg);
		},
		methods: {
			/**
			 * updataRoomInfo  房间信息
			 * updataMsg_list  聊天信息记录
			 * */
			...mapMutations(["updataRoomInfo", "updataMsg_list"]),
			//群聊姓名
			groupName(id) {
				var groupData = this.AllUserData;
				var userinfo = groupData.find(function(a) {
					return a.id == id
				})
				if (userinfo) {
					return userinfo.user_group.nickname;
				} else {
					return ""
				}
			},
			//群聊头像
			groupHead(id) {
				var groupData = this.AllUserData;
				var userinfo = groupData.find(function(a) {
					return a.id == id
				})
				if (userinfo) {
					return userinfo.head_img;
				} else {
					return "../../static/logo.png"
				}
			},
			// 接收到消息
			dispMsg(renderableMsg) {
				const {
					updataMsg_list
				} = this;
				var msg_list = this.msg_list;
				let me = this;
				var _this = this;
				var roomData = this.roomData;
				var userInfo = this.userInfo;
				var myName = 'heiban' + userInfo.id;
				if (!me.__visibility__) return; // 判断是否属于当前会话
				console.log(renderableMsg, '接收到消息')
				var type = this.roomData.type == 1 ? 'chat' : 'groupchat';
				// 判断单聊群聊 和是否是当前会话
				// if (type != renderableMsg.type) return;
				console.log(type == 'chat', (renderableMsg.to != 'heiban' + this.roomData.id))
				console.log(this.roomData)
				if (type == 'chat' && (renderableMsg.from != 'heiban' + this.roomData.id)) return;
				if (type == 'groupchat' && (renderableMsg.to != this.roomData.huanxin_id)) return;


				if (this.roomData.type == 2) {
					// 群消息的 to 是 id，from 是 name
					var sessionKey = roomData.huanxin_id + myName;
					let curChatMsg = uni.getStorageSync(sessionKey) || [];
					var historyChatMsgs = uni.getStorageSync("rendered_" + sessionKey) || [];
					historyChatMsgs = historyChatMsgs.concat(curChatMsg);
					// if (historyChatMsgs.length == 1) {
					// 	_this.getAllUser();
					// }
					uni.setStorageSync("rendered_" + sessionKey, historyChatMsgs)
					uni.setStorageSync(sessionKey, null);
					updataMsg_list([...me.msg_list, renderableMsg]);

					// 判断是不是有新成员加入
					if (renderableMsg.customEvent == 'oneChat') {
						_this.getAllUser();
						console.log("有新成员加入-----------------")
					}

					//#ifdef APP-PLUS
					if (me.scrollIntoView == "items999") {
						me.rollScrollview()
					}
					//#endif
					//#ifdef H5
					me.rollScrollview()
					//#endif
				} else if (renderableMsg.from == 'heiban' + this.roomData.id || renderableMsg.to == 'heiban' + userInfo.id) {
					console.log('单聊接收到消息')
					var sessionKey = myName + 'heiban' + roomData.id;
					let curChatMsg = uni.getStorageSync(sessionKey) || [];
					var historyChatMsgs = uni.getStorageSync("rendered_" + sessionKey) || [];
					historyChatMsgs = historyChatMsgs.concat(curChatMsg);
					uni.setStorageSync("rendered_" + sessionKey, historyChatMsgs)
					uni.setStorageSync(sessionKey, null);
					updataMsg_list([...me.msg_list, renderableMsg]);
					//#ifdef APP-PLUS
					if (me.scrollIntoView == "items999") {
						me.rollScrollview()
					}
					//#endif
					//#ifdef H5
					me.rollScrollview()
					//#endif
				}
			},
			//对方撤回消息
			oppwithdrawMsg(msg) {
				const {
					updataMsg_list
				} = this;
				var _this = this;
				// console.log('收到对方撤回消息',msg)
				var list = JSON.parse(JSON.stringify(_this.msg_list));
				var ind = list.findIndex(function(a, b) {
					return a.id == msg.mid;
				})
				list.splice(ind, 1);
				updataMsg_list(list);
			},
			boxClick() {
				var _this = this;
				this.operation = '';
				// console.log(this.showMore, this.showFace)
				setTimeout(function() {
					if (_this.showMore == true) {
						_this.showMore = false;
					}
					if (_this.showFace == true) {
						_this.showFace = false;
					}
				}, 50)
			},
			// 获取群聊所有成员头像和名字
			getAllUser() {
				let _this = this;
				if (this.roomData.type == 1) return;
				this.$api.post(global.apiUrls.show_all_user, {
					id: _this.roomData.id
				}).then(res => {
					var res = res.data;
					if (res.code == 1) {
						_this.AllUserData = res.data.data;
					} else {
						_this.$message.info(res.msg)
					}
				})
			},
			// 删除单条消息
			deleteMsg(id, item) {

				var _this = this;
				var roomData = this.roomData;
				const {
					updataMsg_list
				} = this;

				msgStorage.delMsg(item, roomData.id, roomData.type == '2' ? item : null);

				var list = JSON.parse(JSON.stringify(_this.msg_list));
				var ind = list.findIndex(function(a, b) {
					return a.id == id;
				})
				list.splice(ind, 1);
				updataMsg_list(list);
				_this.operation = "";
				_this.$message.info('删除成功');
			},
			// 撤回消息
			withdrawMsg(id, userid) {
				var _this = this;
				var roomData = this.roomData;
				const {
					updataMsg_list
				} = this;
				/**
				 * 发送撤回消息
				 * @param {Object} option - 
				 * @param {Object} option.mid -   回撤消息id
				 * @param {Object} option.to -   消息的接收方
				 * @param {Object} option.type -  chat(单聊) groupchat(群组) chatroom(聊天室)
				 */
				var option = {
					mid: id,
					to: userid,
					type: roomData.type == '1' ? 'chat' : 'groupchat',
					success: function(id, serverMsgId) {
						var list = JSON.parse(JSON.stringify(_this.msg_list));
						var ind = list.findIndex(function(a, b) {
							return a.id == id;
						})
						list.splice(ind, 1);
						updataMsg_list(list);
						_this.operation = "";

						var id = WebIM.conn.getUniqueId(); // 生成本地消息id
						var msg = new WebIM.message('custom', id); // 创建文本消息
						var customEvent = "toast"; // 创建自定义事件
						var customExts = {
							text: '撤回消息'
						}; // 消息内容，key/value 需要 string 类型
						msg.set({
							to: userid, // 接收消息对象（用户id）
							customEvent,
							customExts,
							roomType: roomData.type == '1' ? false : true,
							ext: {
								userid: _this.userInfo.id
							},
							chatType: roomData.type == '1' ? 'chat' : 'groupchat',
							success: function(id, serverMsgId) {
								console.log(userid)
								var item = {
									contentsType: "CUSTOM",
									customEvent: customEvent,
									customExts: customExts,
									ext: {
										userid: _this.userInfo.id
									},
									from: 'heiban' + _this.userInfo.id,
									id: serverMsgId,
									message_type: roomData.type == '1' ? 'chat' : 'groupchat',
									time: new Date().getTime(),
									to: userid,
									type: roomData.type == '1' ? 'chat' : 'groupchat'
								}
								msgStorage.delMsg(item, roomData.id, roomData.type == '2' ? item : null);
								msgStorage.oldSaveMsg(item, 'CUSTOM', roomData.type == '2' ? item : {});
								updataMsg_list([..._this.msg_list, item]);
								_this.rollScrollview();
							},
							fail: function(e) {
								_this.showTextFun(e)
							}
						});
						WebIM.conn.send(msg.body);
						_this.$message.info('撤回消息成功');
					},
					fail: function(e) {
						_this.showTextFun(e);
						_this.operation = "";
					}
				};
				WebIM.conn.recallMessage(option) 
			},
			// 复制文本 
			copyText(text) {
				var _this = this;
				uni.setClipboardData({
					data: text,
					success: function() {
						_this.operation = "";
					}
				});
			},
			// 聊天长按
			longpressFun(e, item) {
				this.operation = item;
				this.$forceUpdate()
			},
			touchstartFun(e) {
				this.starScroll = e.changedTouches[0].pageY;
				// console.log(e)
				// console.log(this.starScroll)
			},
			touchendFun(e) {
				var _this = this;
				var top = e.changedTouches[0].pageY;
				if (top - this.starScroll > 50) {
					_this.scrollIntoView = "";
				}
				// console.log(e)
				// console.log(top)
			},
			scrolltolowerFun() {
				var _this = this;
				_this.scrollIntoView = "items999";
				setTimeout(function() {
					_this.scrollIntoView = "items999";
					console.log(_this.scrollIntoView)
				}, 500)
			},
			// 更新聊天室内容
			upDataChat(data) {
				var list = JSON.parse(JSON.stringify(this.msg_list));
				// 判断接收到的消息是不是本房间id
				if (this.roomData.id && (this.roomData.id == data.msg_id)) {
					list.push(data);
				}
				const {
					updataMsg_list
				} = this;

				if (data.char_type == 3) {
					var ind = list.findIndex(function(a, b) {
						return a.id == data.delete_id;
					})
					if (ind != -1) {
						console.log("群聊撤回", ind)
						list.splice(ind, 1);
					}
				}
				updataMsg_list(list);
				if (data.from_uid != this.userInfo.id) {
					//#ifdef APP-PLUS
					if (this.scrollIntoView == "items999") {
						this.rollScrollview()
					}
					//#endif
					//#ifdef H5
					this.rollScrollview()
					//#endif
				} else {
					this.rollScrollview()
				}
			},
			// 修改vuex房间信息zme
			updataRoomInfoFun(type, id, key3 = '') {
				const {
					updataRoomInfo
				} = this;
				if (type == 1) {
					updataRoomInfo({
						type: type, //聊天类型 类型:1好友，2群聊
						id: id, //聊天ID 消息列表获得
						head_img: key3
					})
				} else {
					updataRoomInfo({
						type: type, //聊天类型 类型:1好友，2群聊
						id: id, //聊天ID 消息列表获得
						huanxin_id: key3,
						head_img: ''
					})
				}
			},
			// 节流
			sendMsg: throttle((a, b, c, fn) => {
				fn(a, b, c)
			}, 500),
			// 发送消息zme
			// 消息类型 1 文本 2 图片 3 音频
			onSendMessage(contentsType = 1, duration = "", content) {
				var _this = this;
				var roomData = this.roomData;
				var apiUrl = global.apiUrls.say_msg;
				var data = {};
				const {
					updataMsg_list
				} = this;
				if (contentsType == 1) {
					if (!content) return this.$message.info("请输入发送内容");
				}
				// 群聊单聊
				if (roomData.type == 1) {
					var id = WebIM.conn.getUniqueId(); // 生成本地消息id
					var msg;
					if (contentsType == 1) { // 文本
						msg = new WebIM.message('txt', id); // 创建文本消息
						msg.set({
							msg: content, // 消息内容
							to: 'heiban' + _this.roomData.id, // 接收消息对象（用户id）
							chatType: 'singleChat', // 设置为单聊
							ext: {
								userid: _this.userInfo.id
							},
							success: function(id, serverMsgId) {
								_this.messageContent = "";
								var item = {
									contentsType: "TEXT",
									data: content,
									ext: {
										userid: _this.userInfo.id
									},
									from: 'heiban' + _this.userInfo.id,
									id: serverMsgId,
									message_type: "chat",
									time: new Date().getTime(),
									to: 'heiban' + _this.roomData.id,
									type: "chat"
								}
								msgStorage.oldSaveMsg(item, 'TEXT');
								updataMsg_list([..._this.msg_list, item]);
								_this.rollScrollview();
							},
							fail: function(e) {
								_this.showTextFun(e)
							}
						});

					} else { // 图片 音频
						msg = new WebIM.message('custom', id); // 创建文本消息
						var customEvent = contentsType == 2 ? "image" : "audio"; // 创建自定义事件
						var customExts = {
							url: content,
							duration: duration || ''
						}; // 消息内容，key/value 需要 string 类型
						msg.set({
							to: 'heiban' + _this.roomData.id, // 接收消息对象（用户id）
							customEvent,
							customExts,
							roomType: false,
							ext: {
								userid: _this.userInfo.id
							},
							success: function(id, serverMsgId) {
								var item = {
									contentsType: "CUSTOM",
									customEvent: customEvent,
									customExts: customExts,
									data: content,
									ext: {
										userid: _this.userInfo.id
									},
									from: 'heiban' + _this.userInfo.id,
									id: serverMsgId,
									message_type: "chat",
									time: new Date().getTime(),
									to: 'heiban' + _this.roomData.id,
									type: "chat"
								}
								msgStorage.oldSaveMsg(item, 'CUSTOM');
								updataMsg_list([..._this.msg_list, item]);
								_this.rollScrollview();
							},
							fail: function(e) {
								_this.showTextFun(e)
							}
						});
					}
					WebIM.conn.send(msg.body);
				} else if (roomData.type == 2) {
					var id = WebIM.conn.getUniqueId(); // 生成本地消息id
					var msg;
					if (contentsType == 1) { // 文本
						msg = new WebIM.message('txt', id); // 创建文本消息
						msg.set({
							msg: content, // 消息内容
							to: roomData.huanxin_id, // 接收消息对象（用户id）
							chatType: 'groupChat', // 设置为群聊
							ext: {
								userid: _this.userInfo.id
							},
							success: function(id, serverMsgId) {
								_this.messageContent = "";
								var item = {
									contentsType: "TEXT",
									data: content,
									ext: {
										userid: _this.userInfo.id
									},
									from: 'heiban' + _this.userInfo.id,
									id: serverMsgId,
									message_type: "groupchat",
									msgConfig: null,
									sourceMsg: "1",
									time: new Date().getTime(),
									to: roomData.huanxin_id,
									type: "groupchat",
								}
								msgStorage.oldSaveMsg(item, 'TEXT', item);
								updataMsg_list([..._this.msg_list, item]);
								_this.rollScrollview();
							},
							fail: function(e) {
								_this.showTextFun(e)
							}
						});

					} else { // 图片
						msg = new WebIM.message('custom', id); // 创建文本消息
						var customEvent = contentsType == 2 ? "image" : "audio"; // 创建自定义事件
						var customExts = {
							url: content,
							duration: duration || ''

						}; // 消息内容，key/value 需要 string 类型
						msg.set({
							to: _this.roomData.huanxin_id, // 接收消息对象（用户id）
							customEvent,
							customExts,
							chatType: 'groupChat',
							roomType: true,
							ext: {
								userid: _this.userInfo.id
							},
							success: function(id, serverMsgId) {
								var item = {
									contentsType: "CUSTOM",
									customEvent: customEvent,
									customExts: customExts,
									data: content,
									ext: {
										userid: _this.userInfo.id
									},
									from: 'heiban' + _this.userInfo.id,
									id: serverMsgId,
									message_type: "groupchat",
									time: new Date().getTime(),
									to: roomData.huanxin_id,
									type: "groupChat"
								}
								msgStorage.oldSaveMsg(item, 'CUSTOM', item);
								updataMsg_list([..._this.msg_list, item]);
								_this.rollScrollview();
							},
							fail: function(e) {
								_this.showTextFun(e)
							}
						});
					}
					WebIM.conn.send(msg.body);
				}

			},
			// 发消息错误提示
			showTextFun(e) {
				if (e.type == '603') this.$message.info("被禁言");
				if (e.type == '605') this.$message.info("群组不存在");
				if (e.type == '602') this.$message.info("不在群组或聊天室中");
				if (e.type == '506') this.$message.info("群聊禁言中");
				if (e.type == '504') this.$message.info("撤回消息时超出撤回时间");
				this.messageContent = "";
			},
			// 获取聊天记录 zme page是否获取分页数据
			getListData(id, page = false) {
				var _this = this;
				var obj = {};
				var roomData = this.roomData;
				const {
					updataMsg_list
				} = this;
				var userinfo = uni.getStorageSync("USER_INFO");
				var myName = 'heiban' + userinfo.id;
				if (roomData.type == 1) {
					var sessionKey = myName + 'heiban' + roomData.id;
					let curChatMsg = uni.getStorageSync(sessionKey) || [];
					var historyChatMsgs = uni.getStorageSync("rendered_" + sessionKey) || [];
					historyChatMsgs = historyChatMsgs.concat(curChatMsg);
					uni.setStorageSync("rendered_" + sessionKey, historyChatMsgs)
					uni.setStorageSync(sessionKey, null);
				} else {
					var sessionKey = roomData.huanxin_id + myName;
					let curChatMsg = uni.getStorageSync(sessionKey) || [];
					var historyChatMsgs = uni.getStorageSync("rendered_" + sessionKey) || [];
					historyChatMsgs = historyChatMsgs.concat(curChatMsg);
					uni.setStorageSync("rendered_" + sessionKey, historyChatMsgs)
					uni.setStorageSync(sessionKey, null);
				}
				var showList = [];
				// 是否分页
				if (!page) {
					showList = historyChatMsgs.slice(historyChatMsgs.length - 20 > 0 ? historyChatMsgs.length - 20 : 0,
						historyChatMsgs.length)
					updataMsg_list(showList);
					setTimeout(function() {
						_this.rollScrollview();
					}, 100)
					console.log(showList.length)
				} else {
					if (!_this.pages) {
						if (_this.msg_list.length < historyChatMsgs.length) {
							showList = historyChatMsgs.slice(historyChatMsgs.length - _this.msg_list.length - 30 > 0 ? historyChatMsgs.length -
								_this.msg_list.length - 30 : 0, historyChatMsgs.length)
						} else {
							_this.pages = true;
							showList = historyChatMsgs;
						}
						updataMsg_list(showList);
					}
					console.log(showList.length)
				}

				// #ifdef APP-PLUS
				var webView = _this.$mp.page.$getAppWebview();
				webView.setTitleNViewButtonStyle(0, {
					"type": "menu"
				});
				// #endif


				// #ifdef APP-PLUS
				if (_this.msg_list.length > 4) {
					webView.setStyle({
						'softinputMode': 'adjustPan'
					});
				} else {
					webView.setStyle({
						'softinputMode': 'adjustResize'
					});
				}
				// #endif
				setTimeout(function() {
					_this.loadingBox = false;
				}, 700)
				this.loadingStatus = false;
			},
			// 初始化初始化聊天记录列表 zme
			initMsgList() {
				const {
					updataMsg_list,
					updataRoomInfo
				} = this;
				updataMsg_list([]);
				updataRoomInfo({
					type: "", //聊天类型 类型:1好友，2群聊
					id: "", //聊天ID 消息列表获得 或对方id
				})
				this.pages = false
			},
			// 滚动到最顶部 zme
			getLists(e) {
				var _this = this;
				// 显示加载中
				this.loadingStatus = true;
				if (timer) {
					clearTimeout(timer)
				}
				timer = setTimeout(function() {
					_this.getListData(_this.roomData.id, true)
				}, 300)
			},
			//  滚动到最底部
			rollScrollview() {
				console.log('------------------------------------------------------')
				var _this = this;
				setTimeout(() => {
					_this.scrollTop += 99999;
					_this.scrollIntoView = 'items999';
				}, 500)
				setTimeout(() => {
					_this.scrollTop += 99999;
					_this.scrollIntoView = 'items999';
				}, 1000)
			},
			// 拍照、照片
			handleChooseImage(e) {
				switch (e) {
					case 'camera':
						console.log("拍照，相机")
						this.sendIMG(e);
						break;
					case 'album':
						console.log("照片")
						this.sendIMG(e);
						break;
				}
			},
			// 发送图片
			sendIMG(e) {
				var _this = this;
				uni.chooseImage({
					count: 6, //默认9
					sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
					sourceType: [e], //从相册选择
					success: (res) => {
						this.$popup.showLoading('发送图片...')
						const tempFilePaths = res.tempFilePaths;
						for (let i = 0; i < tempFilePaths.length; i++) {
							_this.uploadImg([tempFilePaths[i]])
						}
					}
				});
			},
			// 上传图片
			uploadImg(tempFilePaths) {
				let _this = this;
				new UploadImage(tempFilePaths, {
					complete: function(res) {
						_this.onSendMessage(2, "", res[0].path)
					}
				});
			},


			// 点击放大图片
			previewImg(e) {
				uni.previewImage({
					urls: [e]
				});
			},
			// 表情
			handleTapFace(e) {
				console.log(e)
				this.messageContent += e;
			},
			// 表情列表 右下角的删除
			onDelete() {
				const str = this.messageContent;
				this.messageContent = str.slice(0, str.length - 1)

			},
			// 左下角 发送录音按钮
			async upload_sound() {
				// #ifdef APP-PLUS
				let status = await this.checkPermission();
				console.log(status)
				if (status !== 1) {
					return;
				}
				// #endif 

				this.soundRecord = !this.soundRecord;
				if (this.soundRecord == false) {
					this.inputfocus = true;
				} else {
					this.inputfocus = false;
				}
				// this.showMore = false; //更多表情弹窗
				// this.showFace = false; //更多功能弹窗
			},
			// 开始录音
			recordStart(e) {
				this.initPoint = e.touches[0].pageY;
				this.duration = 0; // 初始化 时间
				this.durationState = true;
				this.recordTime()
				recorderManager.start();
				this.record = true;

			},
			// #ifdef APP-PLUS
			async checkPermission() {
				var _this = this;
				let status = permision.isIos ? await permision.judgeIosPermission('record') :
					await permision.requestAndroidPermission('android.permission.RECORD_AUDIO');
				console.log(status)
				if (status === null || status === 1 || status == true) {
					status = 1;
				} else if (status === 2) {
					uni.showModal({
						content: "系统麦克风已关闭",
						confirmText: "确定",
						showCancel: false,
						success: function(res) {}
					})
				} else {
					uni.showModal({
						content: "该应用需要访问你的麦克风权限，以便于你发送语音进行聊天",
						confirmText: "设置",
						success: function(res) {
							if (res.confirm) {
								permision.gotoAppPermissionSetting();
							} else {
								// uni.navigateBack()
								_this.$message.info("拒绝授权麦克风");
							}
						}
					})
				}
				return status;
			},
			// #endif
			// 录音时长
			recordTime() {
				let recordTime = setInterval(() => {
					this.duration++
					if (this.durationState == false) {
						// console.log(this.duration);
						clearInterval(recordTime);
					}
				}, 1000);
			},
			// 结束录音
			recordEnd() {
				console.log(99999)
				var _this = this;
				this.record = false;
				this.durationState = false;
				if (this.cancelRecord) {
					return this.cancelRecord = false;
				}

				recorderManager.stop();
				if (this.duration <= 1) return this.$message.info("说话时间太短");
				recorderManager.onStop((res) => {
					const tempFilePaths = res.tempFilePath;
					// 开始上传
					new UploadFileToOSS([tempFilePaths], {
						complete: function(res) {
							// 上传成功 返回数据格式为数组 [ { id: '', path: '' } ]
							_this.onSendMessage(3, _this.duration, res[0].path)
						}
					})
				});
			},
			// 上滑取消发送录音
			recordMove(e) {
				if (timer) {
					clearTimeout(timer)
				}
				this.touchesY = e.touches[0].pageY;
				//上滑达到一定距离显示取消发送
				if (this.initPoint - this.touchesY >= uni.upx2px(400)) {
					this.cancelRecord = true;
					timer = setTimeout(() => {
						this.record = false;
						this.durationState = false;
						this.cancelRecord = false;
						recorderManager.stop();
						recorderManager.onStop((res) => {
							console.log("取消发送", res)
						});
					}, 500)
				} else {
					this.cancelRecord = false;

				}
			},
			// 播放录音
			playRecord(item) {
				// console.log(item)
				if (item.contentsType != 'CUSTOM' || item.customEvent != 'audio') return;
				for (let i in this.say_list) {
					if (this.say_list[i].typeplay == true) {
						this.say_list[i].typeplay = false
					}
				}
				clearInterval(endTime);
				this.$nextTick(function() {
					item.typeplay = true;
				})
				let num = 0;
				let endTime = setInterval(() => {
					num++
					if (num == item.customExts.duration || item.customExts.duration == 0) {
						item.typeplay = false;
						clearInterval(endTime);
						this.$forceUpdate()
					}
				}, 1000)
				innerAudioContext.src = item.customExts.url;
				innerAudioContext.play();
				this.$forceUpdate()
			},
			// 切换表情
			handleToggleFace() {
				this.inputfocus = false;
				this.showFace = !this.showFace
				this.showMore = false;
				this.soundRecord = false;
				// if
				setTimeout(() => {
					this.rollScrollview()
				}, 100)
			},
			// 切换更多盒子显示与隐藏
			handleToggleMore() {
				this.inputfocus = false;
				this.showMore = !this.showMore
				this.showFace = false;
				this.soundRecord = false;
				setTimeout(() => {
					this.rollScrollview()
				}, 100)

			},
			//替换表情符号为图片
			replaceEmoji(str) {
				// 正则表达式匹配内容
				let replacedStr = str.replace(/\[([^(\]|\[)]*)\]/g, (item, index) => {
					let face = this.faceImage.find(sub => sub.name == item)
					return face ?
						'<img style="vertical-align: middle; width:24px;height:24px; display: inline-block;" onclick="" src="' +
						face
						.image.replace('/static/', 'http://www.sqhbb.com/') + '">' : item
				});
				return '<div style="vertical-align: middle; align-items: center;word-break: break-all; word-break: break-word;">' +
					replacedStr + '</div>';
			}, 
		},
		// 监听导航右边点击事件
		onNavigationBarButtonTap(e) {

			if (this.roomData.type == 1) {
				uni.navigateTo({
					url: `/pages/friendData/singleDetails?id=${this.roomData.id}`
				})
			} else {
				uni.navigateTo({
					url: `/pages/friendData/groupDetails?id=${this.roomData.id}&is_join=1`
				})

			}
		}
	}
</script>
<style lang="less">
	@import "./chat.less";

	page {
		-webkit-touch-callout: none;
	}

	// .chatImage {
	// 	max-height: 300rpx;
	// }
	.chat-row {
		position: relative;
	}

	.operationBox {
		position: absolute;
		width: 100%;


		&.justify-start {
			.operation {
				&::before {
					left: 90rpx;
				}
			}
		}

		&.justify-end {
			.operation {
				&::before {
					right: 90rpx;
				}
			}
		}
	}


	.operation {
		position: relative;
		width: 388rpx;
		border-radius: 10rpx;
		background-color: #080808;
		color: #FFFFFF;
		margin-top: 10rpx;

		view {
			height: 80rpx;
			line-height: 80rpx;
		}

		&::before {
			border: 15rpx solid transparent;
			border-top: 15rpx solid #080808;
			width: 0;
			height: 0;
			position: absolute;
			bottom: -25rpx;
			content: ' '
		}
	} 
	.operation1 {
		width: 288rpx;
	} 
	.solid-right {
		border-right: 1px solid #5e5e5e;
	} 
	.fixedBox {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: #FFFFFF;
		z-index: 999;
	}
</style>
