<template>
	<view>
		<view class="" v-html="xieyi"> </view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
			xieyi:'', 
			}
		},
		onLoad(options) {
			this.getxieyi(options.index)
			uni.setNavigationBarTitle({
			  title: options.index == 1 ? '用户协议' : '隐私协议'
			})
		},
		methods: {
			getxieyi(options){
				console.log(options)
				this.$api.post(global.apiUrls.myXieyi).then(res => {
					console.log(res)
					var res = res.data;
					if (res.code == 1) { 
						if(options==1){
							this.xieyi = res.data.zhuche
						}else{
							this.xieyi = res.data.yinsixieyi
						}
						// _this.showData = res.data;
					}
				})
				
			},
		}
	}
</script>

<style>

</style>
