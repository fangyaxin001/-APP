<template>
	<view class="login">
		<!-- logo -->
		<image src="../static/logo.png" mode="aspectFill" class="login-icon"></image>
		<view class="text-xxl text-bold text-center">神奇黑板报</view>
		<view class="member-form padding-lr-lg padding-top">
			<!-- 选择登录方式 -->
			<view class="login-methods" v-if="loginFlag">
				<view class="text-center login-box">
					<image src="../static/imgs/icon/wecat.png" mode="aspectFill" @tap="handleLoginUseWechat"></image>
					<image src="../static/imgs/icon/qq.png" mode="aspectFill" @tap="handleLoginUseQQ"></image>
					<view class="login-text">
						选择登录方式
					</view>
					<view class="agreement">
						<image v-if="!agreement" src="../static/imgs/icon/chose1.png" mode="" @click="onAgreement()"></image>
						<image v-else src="../static/imgs/icon/choseSel.png" mode="" @click="onAgreement()"></image>
						<text>点击查看</text>
						<text class="text" @click="xieyi(1)">《用户注册协议》</text>
						<text>与</text>
						<text class="text" @click="xieyi(2)">《隐私政策》</text>
					</view>
				</view>
			</view> 
			<!-- 绑定手机号 -->
			<view class="member-login" v-else>
				<view class="flex align-center justify-between member-input">
					<image src="../static/imgs/icon/login-phone.png" mode="aspectFill" class="icon-img"></image>
					<input class="uni-input flex-sub" type="number" v-model="phone" placeholder="请输入手机号" maxlength="11" />
					<!-- <button class="yanZhengMa text-blu text-sm text-bold" :loading="verCodeBtnLoading" @tap="handleSendVerCode">{{ beginning ? time + 's后重新获取' : '获取验证码' }}</button> -->
				</view>
				<view class="flex align-center justify-between member-input">
					<image src="../static/imgs/icon/login-password.png" mode="aspectFill" class="icon-img"></image>
					<input class="uni-input flex-sub" type="password" @confirm="reg" maxlength="12" v-model="password" placeholder="请输入密码" />
				</view>
				<button class="edit-btn text-xl text-white" :class="formstatus?'bg-blu':''" :loading="is_click" @tap="reg">确定</button>
			</view>
		</view> 
	</view>
</template>

<script>
	let _this;
	import {
		validate
	} from '@/common/utils/index';
	let timer = null;
	let WebIM = require("../utils/WebIM")["default"];
	let disp = require("../utils/broadcast");
	export default {
		data() {
			return {
				is_click: false, //加载动画
				phone: '', //手机号
				password: '', //验证码
				verCodeBtnLoading: false, //获取验证码loading
				time: 60, //倒计时60S
				beginning: false, //显示倒计时
				formstatus: true, //表单校验是否通过
				loginmethods: false, //是否选择登录方式
				OPEN_PUSH_AUTH: false, // 是否开启推送
				grant_type: "password", //hx
				agreement:false, 
				loginFlag :false, //判断登录扥登录状态
			}
		},
		onLoad() {
			_this = this;
			 _this.$api.post(global.apiUrls.loginFlag,  )
					.then(res => {
						console.log(res)
						console.log( res.data.data.code)
						_this.loginFlag =  res.data.data.code ? false:true
					})
		},
		methods: {
			// 用户协议链接
			xieyi(index){
				// index 1用户注册协议 2隐私协议
				uni.navigateTo({
					url:"/pages/login_xieyi/login_xieyi?index="+index
				})
				
			},
			// 同意用户协议
			onAgreement() {
			
				this.agreement = !this.agreement;
				this.$emit("onAgreement",this.agreement)
					console.log(this.agreement)
			},
			//发送验证码
			handleSendVerCode() {
				let {
					phone
				} = this;
				if (!validate(phone, 'phone')) {
					_this.$message.info('请正确输入手机号');
					return false;
				}
				if (_this.beginning) return false;
				if (_this.verCodeBtnLoading) return false;
				_this.verCodeBtnLoading = true;
				_this.$api.post(global.apiUrls.GetVerifyCode, {
						is_test: global.IS_DEV,
						mobile: phone,
						type: '2'
					})
					.then(res => {
						_this.verCodeBtnLoading = false;
						if (res.data.code == 1) {
							_this.$message.info('验证码已发送');
							_this.beginning = true;
							//显示倒计时
							clearInterval(_this.timer);
							//开始倒计时
							_this.timer = setInterval(() => {
								if (_this.time == 1) {
									//倒计时结束
									clearInterval(_this.timer);
									_this.time = 60;
									_this.beginning = false;
									return;
								}
								_this.time--;
							}, 1000);
						} else {
							_this.$message.info(res.data.msg);
						}
					});
			},
			//登录
			reg() {
				if (_this.is_click) {
					return;
				}
				if (timer) {
					clearTimeout(timer);
				}
				timer = setTimeout(() => {
					let {
						phone,
						password
					} = _this;

					if (!phone) {
						_this.$message.info('请输入手机号');
						return false;
					}
					if (!validate(phone, 'phone')) {
						_this.$message.info('请输入正确的手机号');
						return false;
					}
					if (!validate(password, 'password')) {
						_this.$message.info('请输入字母加数字6-12位密码');
						return false;
					}

					_this.is_click = true;
					_this.$api.post(global.apiUrls.postloginByAccount, {
						mobile: phone,
						password: password
					}).then(res => {
						if (res.data.code == 1) {
							_this.$message.info(res.data.msg);
							global.token = res.data.data.userinfo.user_token
							global.userInfo = res.data.data.userinfo
							uni.setStorageSync('USER_TOKEN', global.token)
							uni.setStorageSync('USER_INFO', global.userInfo)
							getApp().globalData.conn.open({
								apiUrl: WebIM.config.apiURL,
								user: res.data.data.userinfo.huanxin_id,
								pwd: '123456',
								grant_type: _this.grant_type,
								appKey: WebIM.config.appkey
							});
							uni.switchTab({
								url: "/pages/message/index"
							})
							setTimeout(() => {
								uni.hideLoading();
								_this.is_click = false;
								disp.fire('appLoginSuccess', {
									msg: '登录成功'
								})
							}, 300)

						} else {
							_this.is_click = false;
							_this.$message.info(res.data.msg);
						}
					})
				}, 300)
			},
			// 微信登录
			handleLoginUseWechat() {
				if (!this.agreement) {
					this.$message.info('请勾选用户注册协议与隐私协议');
					return false;
				}
				if (this.is_click) {
					return;
				}

				let {
					OPEN_PUSH_AUTH
				} = this
				let self = this
				let clientId = 'clientId'
				let appSystem = 'appSystem'
				uni.login({
					provider: 'weixin',
					success: function(loginRes) {
						console.log(loginRes)
						self.is_click = true;
						uni.getUserInfo({
							provider: 'weixin',
							success: function(infoRes) {
								uni.showLoading({
									title: '登录中'
								})

								// #ifdef APP-PLUS
								if (OPEN_PUSH_AUTH) {
									clientId = plus.push.getClientInfo().clientid || '';
									appSystem = uni.getSystemInfoSync().platform == 'ios' ? 1 : 2;
								}
								// #endif
								console.log(infoRes, 333333333333333333333333333333333333333333333)
								self.$api.post(global.apiUrls.loginWxByQuick, {
									type: 1,
									wx_unionid: infoRes.userInfo.unionId,
									qq_unionid: '',
									wb_unionid: '',
									openid: infoRes.userInfo.openId,
									clientId: clientId || '',
									appSystem: appSystem || '',
									nickname: infoRes.userInfo.nickName,
									avatar: infoRes.userInfo.avatarUrl,
									gender: infoRes.userInfo.gender,
								}).then(res => {
									uni.hideLoading()
									self.otherLoginSuccess(res)
								}).catch(err => {
									uni.hideLoading()
									self.is_click = false;
								})
							}
						});
					}
				});
			},

			// QQ登录
			handleLoginUseQQ() {
				if (!this.agreement) {
					this.$message.info('请勾选用户注册协议与隐私协议');
					return false;
				}
				if (this.is_click) {
					return;
				}
				let {
					OPEN_PUSH_AUTH
				} = this
				let self = this
				let clientId = 'clientId'
				let appSystem = 'appSystem'
				uni.login({
					provider: 'qq',
					success: function(loginRes) {
						self.is_click = true;
						console.log(loginRes)
						uni.getUserInfo({
							provider: 'qq',
							success: function(infoRes) {
								uni.showLoading({
									title: '登录中'
								})

								// #ifdef APP-PLUS
								if (OPEN_PUSH_AUTH) {
									clientId = plus.push.getClientInfo().clientid || '';
									appSystem = uni.getSystemInfoSync().platform == 'ios' ? 1 : 2;
								}
								// #endif


								self.$api.post(global.apiUrls.loginByQuick, {
									type: 2,
									wx_unionid: '',
									qq_unionid: infoRes.userInfo.openId,
									wb_unionid: '',
									clientId: clientId || '',
									appSystem: appSystem || '',
									nickname: infoRes.userInfo.nickName,
									avatar: infoRes.userInfo.avatarUrl,
									gender: infoRes.userInfo.gender == '男' ? 1 : 0,
								}).then(res => {
									uni.hideLoading()
									self.otherLoginSuccess(res)
								}).catch(err => {
									console.log(err)
									uni.hideLoading()
									self.is_click = false;
								})
							}
						});
					}
				});
			},

			// 第三方登陆登陆成功
			otherLoginSuccess(res) {
				var _this = this;
				_this.is_click = false;
				console.log(res.data, 888888888888888888888888888888888888888888888)
				if (res.data.code == 1) {
					try {
						_this.$message.info(res.data.msg);
						global.token = res.data.data.userinfo.user_token
						global.userInfo = res.data.data.userinfo
						uni.setStorageSync('USER_TOKEN', global.token)
						uni.setStorageSync('USER_INFO', global.userInfo)
						getApp().globalData.conn.open({
							apiUrl: WebIM.config.apiURL,
							user: res.data.data.userinfo.huanxin_id,
							pwd: '123456',
							grant_type: _this.grant_type,
							appKey: WebIM.config.appkey
						});
						uni.switchTab({
							url: "/pages/message/index"
						})
						disp.fire('appLoginSuccess', {
							msg: '登录成功'
						})
						setTimeout(() => {
							uni.hideLoading();
						}, 300)
					} catch (e) {
						console.log(e)
					}
				}
			},

		}
	}
</script>

<style>
	page {
		background-color: #FFFFFF;
		overflow: hidden;
	}
</style>
<style scoped lang="less">
	.text-xxl {
		font-size: 40rpx !important;
	}

	.login-icon {
		display: block;
		width: 172rpx;
		height: 172rpx;
		border: 8rpx;
		margin: 0 auto;
		margin-top: 160rpx;
		margin-bottom: 48rpx;
		border-radius: 16rpx;
	}

	.icon-img {
		width: 38rpx;
		height: 38rpx;
		margin-top: -1rpx;
	}

	.member-login {
		margin-top: 100rpx;
	}

	.member-input {
		height: 110rpx;
		line-height: 110rpx;
		border-bottom: 1px solid #EEEEEE;
		padding: 30rpx 32rpx;

		input {
			font-size: 32rpx;
			padding: 0 20rpx;
		}
	}

	.edit-btn {
		width: 600rpx;
		height: 88rpx;
		background: #CCEDFE;
		border-radius: 45rpx;
		margin-top: 99rpx;

		&:after {
			border: none !important;
		}
	}

	.yanZhengMa {
		height: 90upx;
		line-height: 90upx;
		padding: 0;
		background: none;

		&:after {
			border: none !important;
		}
	}

	.login-box {
		margin-top: 550rpx;

		image {
			width: 84rpx;
			height: 84rpx;

			&:first-child {
				margin-right: 72rpx;
			}
		}

		.login-text {
			margin-top: 64rpx;
			font-size: 26rpx;
			color: #CED1D7;
		}
	}
	// 协议
	.agreement {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		color: #666;
		padding-bottom: 60rpx;
		margin-top: 66upx;
		image {
			width: 30upx;
			height: 30upx;
			margin-right: 8upx !important;
		}
		text {
		}
		.text {
			color: #267dff;
		}
	}
</style>
