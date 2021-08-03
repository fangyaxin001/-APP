<template>
	<view class="">
		<cu-custom bgColor="bg-eded text-xl" :isBack="false">
			<block slot="content"><text class="text-lg">消息</text><text class="cuIcon-loading2 cuIconfont-spin" v-if="starStatus"></text></block>
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

		<view class="content" v-if="listData.length>0 && AllUserData.length>0">
			<view class="cu-list menu-avatar">
				<view class="cu-item" :class="modalName=='move-box-'+ index?'move-cur':''" v-for="(item,index) in listData" :key="index"
				 @touchstart="ListTouchStart" @touchmove="ListTouchMove" @touchend="ListTouchEnd" :data-target="'move-box-' + index"
				 @click="handleJump" :data-url="`/pages/chat/chat?id=${getItemInfo(AllUserData,index,'to_id',item)}&type=${item.type=='chat'?1:2}&title=${getItemInfo(AllUserData,index,'group_title',item)}&group_id=${item.to}&head_img=${getItemInfo(AllUserData,index,'thumb',item)}`">
					<view class="cu-avatar user-img">
						<u-image :src="getItemInfo(AllUserData,index,'thumb',item)" mode="aspectFill" width="94rpx" height="94rpx"
						 border-radius="8rpx" :lazy-load="true"></u-image>
						<view class="cu-tag badge" :class="getItemInfo(AllUserData,index,'is_not_disturb',item)==1?'bg-999':''" v-if="item.unReadCount">{{item.unReadCount>99?'99+':item.unReadCount}}</view>
					</view>
					<view class="content">
						<view class="text-df text-black text-cut">{{getItemInfo(AllUserData,index,'group_title',item)}}</view>
						<view class="text-gray text-sm text-cut" v-if="item.contentsType=='TEXT'">{{item.data}}</view>
						<view class="text-gray text-sm text-cut" v-else-if="item.customEvent=='toast' || item.customEvent=='oneChat'">{{item.customExts.text}}</view>
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
		<uni-popup ref="popup2" type="dialog">
			<uni-popup-dialog type="info" title="确定删除该聊天记录吗？" :before-close="true" @confirm="confirmTwo" @close="close"></uni-popup-dialog>
		</uni-popup>
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
				// AllUserData: [], //会话列表信息
				loginStu: false,
				delObj:null,//待删除聊天记录
			}
		},
		onShow() {
			var _this = this;
			const {
				updatamMssageList
			} = this;
			

		},
		onLoad() {
			if (!global.userInfo) return uni.navigateTo({
				url: "/pages/login"
			})
			// 更新会话列表
			if (global.userInfo) {
				disp.fire("message.show", {});
				// disp.fire("chat.history", {});
			}
		},
		onHide() {
			// this.clearData() 
		},
		// 监听页面卸载
		onUnload() {},
		computed: {
			...mapState({
				listData: (state) => state.message.messageList, //消息列表数据
				AllUserData: (state) => state.message.AllUserData, 
				starStatus: (state) => state.message.starStatus, 
				
			}),
		},
		methods: {
			...mapMutations(['updatamMssageList']),
			close(done) {
				done()
			},
			confirmTwo(done){
				var data = this.delObj;
				if (data.type.toLowerCase() == 'groupchat') {
					var sessionKey = data.to + 'heiban' + global.userInfo.id;
					uni.removeStorageSync(sessionKey);
					uni.removeStorageSync("rendered_" + sessionKey);
					disp.fire("chat.history", null);
				} else {
					var sessionKey = data.to == 'heiban' + global.userInfo.id ? data.to + data.from : data.from + data.to;
					console.log(sessionKey)
					uni.removeStorageSync(sessionKey);
					uni.removeStorageSync("rendered_" + sessionKey);
					disp.fire("chat.history", null);
				}
				done()
			},
			//根据id获取会话列表的详情
			getItemInfo(AllUserData, index, key, item) {
				// console.log(AllUserData)
				// console.log(item)
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
			clearData() {
				const {
					updatamMssageList
				} = this;
				updatamMssageList([])
			},
			// 删除列表消息
			chatDelete(data) {
				this.delObj = data;
				this.$refs.popup2.open();
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
