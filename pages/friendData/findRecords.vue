<template>
	<view class="search">
		<cu-custom bgColor="bg-eded text-xl" :isBack="true">
			<block slot="right">
				<view class="flex align-center w-100">
					<view class="flex align-center flex-sub bg-white search-inp">
						<text class="cuIcon-search lg flex-shrink"></text>
						<input type="text" v-model="search" maxlength="50" class="flex-sub padding-left-xs text-df" placeholder="请输入关键词"
						 @confirm="searchFun" />
					</view>
					<text class="text-lg text-blu1 flex-shrink margin-left-sm margin-right" @click="searchFun">搜索</text>
				</view>
			</block>
		</cu-custom>

		<view class="cu-list menu-avatar" v-if="listData.length>0">
			<view class="cu-item" v-for="(item,index) in listData" :key="index" @click="detailFun(item)">
				<view class="cu-avatar user-img">
					<u-image :src="eventData.headimg || groupHead(item.ext.userid)" mode="aspectFill" width="94rpx" height="94rpx"
					 border-radius="8rpx" :lazy-load="true"></u-image>
				</view>
				<view class="content">
					<view class="text-df text-black text-cut">{{eventData.nickname || groupName(item.ext.userid)}}</view>
					<view class="text-df text-black text-cut2">{{item.data}}</view>
				</view>
				<view class="action flex-shrink">
					<view class="text-gray text-sm">{{filterLable(item.time)}}</view>
					<view class="text-gray text-xs visibility">22:20</view>
				</view>
			</view>
			<view class="text-grey text-center padding-top padding-bottom text-xs" v-if="listData.length>5">我们是有底线的～</view>
		</view>
		<cu-none v-else></cu-none>
		<view class="cu-modal" :class="modalName=='Image'?'show':''" >
			<view class="cu-dialog">
				<view class="flex justify-between text-black padding-lr-sm padding-top-sm">
					<view class="text-lg text-bold" v-if="modalData">
						{{eventData.nickname || groupName(modalData.ext.userid)}}
					</view>
					<view class="action text-xl" @tap="hideModal">
						<text class="cuIcon-close"></text>
					</view>
				</view>
				<view class="padding-sm text-normal text-left">
					{{modalData.data}}
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				search: "", //搜索内容
				userInfo: global.userInfo, //用户信息
				listData: [], //搜索记录
				eventData: "",
				AllUserData: [], //所有群成员
				modalName: "",
				modalData: ""
			}
		},
		onLoad(e) {
			this.eventData = e;
			if (e.type == 2) {
				this.getAllUser();
			}
		},

		methods: {
			filterLable: function(value) {
				let data = new Date();
				let now = data.getTime();
				let time = (now - value) / 1000 / 60;
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
				return timeStr;
			},
			detailFun(item) {
				this.modalName = 'Image'
				this.modalData = item;
			},
			hideModal(e) {
				this.modalName = null
			},
			backFun() {
				uni.navigateBack({
					delta: 1
				})
			},
			searchFun() {
				var _this = this;
				var e = this.eventData;
				if (!this.search.trim()) return this.$message.info('请输入搜索内容');
				var fromid = e.fromid;
				let userinfo = uni.getStorageSync("USER_INFO");
				let myName = 'heiban' + userinfo.id;
				var sessionKey;
				if (e.type == 1) {
					sessionKey = myName + fromid;
				} else {
					sessionKey = fromid + myName;
				}
				var history = uni.getStorageSync("rendered_" + sessionKey) || [];
				var filterData = history.filter(function(a) {
					var text = a.data;
					if (a.contentsType == 'TEXT') {
						return text.indexOf(_this.search.trim()) != -1;
					}
				})
				this.listData = filterData;
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
					return ""
				}
			},
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
			// 获取群聊所有成员头像和名字
			getAllUser() {
				let _this = this;
				if (this.eventData.type == 1) return;
				this.$api.post(global.apiUrls.show_all_user, {
					id: _this.eventData.group_id
				}).then(res => {
					var res = res.data;
					if (res.code == 1) {
						_this.AllUserData = res.data.data;
					} else {
						_this.$message.info(res.msg)
					}
				})
			},
		}

	}
</script>

<style lang="less" scoped>
	page {
		background-color: #FFFFFF;
	}

	.text-normal {
		user-select: text;
		-webkit-user-select: text;
	}

	.search-inp {
		height: 60rpx;
		padding: 12rpx 24rpx;
		border-radius: 8rpx;
	}

	.user-img {
		display: block;
		width: 94rpx;
		height: 94rpx;
		border-radius: 8rpx;
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

	.cu-list.menu-avatar>.cu-item .content {
		width: calc(100% - 96rpx - 60rpx - 170rpx - 20rpx)
	}

	.cu-list .content {
		view:first-child {
			width: 300rpx;
		}
	}
</style>
