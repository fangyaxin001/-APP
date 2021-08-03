<template>
  <view>
    
    <view class="u-m-t-42" style="margin: 30rpx 32rpx 0 32rpx">
      <view class="text-666 u-font-28">
        请选择举报原因
      </view>
      <view class="text-333" v-for="(item,i) in list">
      <view class="flex justify-between align-center" style="padding: 32rpx 0;border-bottom: 1rpx solid #EEEEEE;" @click="index=i">
        <view class="">
          {{item}}
        </view>
        <image src="../../static/imgs/go.png" v-show="index==i"  style="width: 44rpx;height: 32rpx;" mode=""></image>
      </view>
      </view>
    </view>
    <view class="" style="height: 20rpx; background-color: #EEEEEE;"></view>
    <view class="" style="padding: 32rpx;">
      <view class="">
        <text class="text-333 u-font-32">补充描述</text>
        <text class="text-666 u-font-24">（选填）</text>
      </view>
      <textarea value="" style="padding: 32rpx 0;border-bottom: 1rpx solid #EEEEEE; width: 686rpx;height: 180rpx;" placeholder="请详细描述您的问题，方便我们快速处理" placeholder-class="text-bf u-font-28"/>
      <view class="u-m-t-32 u-m-b-32">
        <!-- <text class="text-333 u-font-32">图片证据</text> -->
        <!-- <text class="text-666 u-font-24">（最多支持3张图片）</text> -->
      </view>
	  <view class="tuesa" @click="nias" >
	  	确定
	  </view>
        <!-- <image src="../../../static/icon/addPicture.png" style="width: 220rpx;" mode="widthFix"></image> -->
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        index:0,
        list:['发广告','骚扰谩骂','涉黄','骗子','其他']
      };
    },
	methods:{
		nias(){
			this.$message.error("举报成功")
			setTimeout(()=>{
				 uni.navigateBack()
			},500)
		}
	}
  }
</script>

<style lang="scss">
.tuesa{
	text-align: center; 
	color: #FFFFFF;
	background-color: #007AFF;
	width: 500rpx;
	height: 70rpx;
	line-height: 70rpx;
	margin: auto;
	border-radius: 20rpx;
}
</style>
