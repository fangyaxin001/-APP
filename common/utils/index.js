import Router from './router.js'
// 在可预见的未来会把moment.js更换为更轻量级的day.js
// import moment from './moment.js'
import Dayjs from './day.js'
import UploadImage from './upload-image.js'
import UploadFileToQINIU from './upload-file-to-qiniu.js'
import UploadFileToOSS from './upload-file-to-oss.js'
import {
	message
} from './message.js'
import {
	validate
} from './validate.js'
import updateApp from './update_app.js'
// 节流
const throttle = (fn, delay) => {
	//进入的时间，其实就是用户什么时候 触发 的 滚动条
	var enterTime = 0;
	var gapTime = delay || 200; //间隔时间
	return function() {
		var context = this;
		//第一次 执行 return 里面的匿名函数方法的时间
		var backTime = new Date();
		// 用户 触发 到 执行是需要时间的，因此 如果 执行匿名函数方法的时间 减去 出发的时间 大于间隔的时间，就进行函数的触发；
		if (backTime - enterTime > gapTime) {
			fn.apply(context, arguments);
			//把执行匿名函数方法的时间保存 到 触发的时间，以便 第二次运行函数
			enterTime = backTime
		}
	}
}
export {
	throttle,
	Dayjs,
	message,
	validate,
	UploadImage,
	UploadFileToQINIU,
	UploadFileToOSS,
	updateApp,
	Router
}
