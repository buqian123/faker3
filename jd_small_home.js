/*
东东小窝 jd_small_home.js
Last Modified time: 2021-6-27 13:27:20
现有功能：
做日常任务任务，每日抽奖（有机会活动京豆，使用的是免费机会，不消耗WO币）
自动使用WO币购买装饰品可以获得京豆，分别可获得5,20，50,100,200,400,700，1200京豆）

注：目前使用此脚本会给脚本内置的两个码进行助力，请知晓

活动入口：京东APP我的-游戏与更多-东东小窝
或 京东APP首页-搜索 玩一玩-DIY理想家
微信小程序入口：
来客有礼 - > 首页 -> 东东小窝
网页入口（注：进入后不能再此刷新，否则会有问题，需重新输入此链接进入）
https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html

已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
===============Quantumultx===============
[task_local]
#东东小窝
16 22 * * * jd_small_home.js, tag=东东小窝, img-url=https://raw.githubusercontent.com/58xinian/icon/master/ddxw.png, enabled=true

================Loon==============
[Script]
cron "16 22 * * *" script-path=jd_small_home.js, tag=东东小窝

===============Surge=================
东东小窝 = type=cron,cronexp="16 22 * * *",wake-system=1,timeout=3600,script-path=jd_small_home.js

============小火箭=========
东东小窝 = type=cron,script-path=jd_small_home.js, cronexpr="16 22 * * *", timeout=3600, enable=true
 */
const $ = new Env('东东小窝');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message = '';
let isPurchaseShops = false;//是否一键加购商品到购物车，默认不加购
$.helpToken = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
$.newShareCodes = [];
const JD_API_HOST = 'https://lkyl.dianpusoft.cn/api';

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n*******开始【京东账号${$.index}】${$.nickName || $.UserName}********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await smallHome();
    }
  }
  $.inviteCodes = await getAuthorShareCode('https://raw.githubusercontent.com/Aa123on-lv/updateTeam/master/shareCodes/jd_updateSmallHomeInviteCode.json')
  if (!$.inviteCodes) {
    $.http.get({url: 'https://purge.jsdeliv123r.net/gh/Aa123on-lv/updateTeam@master/shareCodes/jd_updateSmallHomeInviteCode.json'}).then((resp) => {}).catch((e) => $.log('刷新CDN异常', e));
    await $.wait(1000)
    $.inviteCodes = await getAuthorShareCode('https://cdn.jsdeliv123r.net/gh/Aa123on-lv/updateTeam@master/shareCodes/jd_updateSmallHomeInviteCode.json')
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.token = $.helpToken[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      if ($.newShareCodes.length > 1) {
        // console.log('----', (i + 1) % $.newShareCodes.length)
        let code = $.newShareCodes[(i + 1) % $.newShareCodes.length]['code']
        console.log(`\n${$.UserName} 去给自己的下一账号 ${decodeURIComponent($.newShareCodes[(i + 1) % $.newShareCodes.length]['cookie'].match(/pt_pin=([^; ]+)(?=;?)/) && $.newShareCodes[(i + 1) % $.newShareCodes.length]['cookie'].match(/pt_pin=([^; ]+)(?=;?)/)[1])}助力，助力码为 ${code}`)
        await createAssistUser(code, $.createAssistUserID);
      }
      await helpFriends();
    }
  }
})()
    .catch((e) => {
      $.log('', `