import { log, ScanStatus, WechatyBuilder } from "wechaty";
import { PuppetPadlocal } from "wechaty-puppet-padlocal";
import { dingDongBot, getMessagePayload, LOGPRE } from "./helper";
import { sendMsg } from "./spark";
import * as PUPPET from "wechaty-puppet";

/****************************************
 * 去掉注释，可以完全打开调试日志
 ****************************************/
// log.level("silly");

const puppet = new PuppetPadlocal({
  token: "puppet_padlocal_cee4dff75e8d451d82137dab33bf4641",
});

const bot = WechatyBuilder.build({
  name: "PadLocalDemo",
  puppet,
})
  .on("scan", (qrcode, status) => {
    if (status === ScanStatus.Waiting && qrcode) {
      const qrcodeImageUrl = [
        "https://wechaty.js.org/qrcode/",
        encodeURIComponent(qrcode),
      ].join("");

      log.info(LOGPRE, `onScan: ${ScanStatus[status]}(${status})`);

      console.log(
        "\n=================================================================="
      );
      console.log("\n* Two ways to sign on with qr code");
      console.log("\n1. Scan following QR code:\n");

      require("qrcode-terminal").generate(qrcode, { small: true }); // show qrcode on console

      console.log(`\n2. Or open the link in your browser: ${qrcodeImageUrl}`);
      console.log(
        "\n==================================================================\n"
      );
    } else {
      log.info(LOGPRE, `onScan: ${ScanStatus[status]}(${status})`);
    }
  })

  .on("login", (user) => {
    log.info(LOGPRE, `${user} login`);
  })

  .on("logout", (user, reason) => {
    log.info(LOGPRE, `${user} logout, reason: ${reason}`);
  })

  .on("message", async (message) => {
    // 在这里添加保存当前启动时间的逻辑
    const startTime = new Date(); // 获取当前启动时间
    log.info(LOGPRE, `on message: ${message.toString()}`);

    // 获取群聊名称
    const roomName = message.room()?.topic();
    // 获取发送者昵称
    const sender = message.talker().name();
    // 获取消息内容
    const content = message.text();

    // 判断消息类型(附件、音频、视频、表情、图片、URL或小程序)
    await getMessagePayload(message);
    // 执行消息发送
    await dingDongBot(message);

    // 不处理自己的消息
    if (message.self()) {
      return;
    }

    // 群聊消息
    if (message.room()) {
      // 不处理自己的消息
      if (message.self()) {
        return;
      }

      const mesTime = new Date();
      if (mesTime >= startTime) {
        // 如果 content 以 "@初心" 开头，那么这里的代码将被执行
        if (content.startsWith("@初心")) {
          // const reply = `你好，${sender}！这是来自群聊${roomName}的消息：${content}`;
          // await message.say(reply);

          await getMessagePayload(message);

          if (message.type() == PUPPET.types.Message.Text) {
            await sendMsg(message.text(), (data: string) => {
              message.say(data);
            });
          }

          // 如果 content 不以 "@初心" 开头，那么这里的代码将被执行
        } else {
          // ...
        }
      }
    }
  })

  .on("room-invite", async (roomInvitation) => {
    log.info(LOGPRE, `on room-invite: ${roomInvitation}`);
  })

  .on("room-join", (room, inviteeList, inviter, date) => {
    log.info(
      LOGPRE,
      `on room-join, room:${room}, inviteeList:${inviteeList}, inviter:${inviter}, date:${date}`
    );
  })

  .on("room-leave", (room, leaverList, remover, date) => {
    log.info(
      LOGPRE,
      `on room-leave, room:${room}, leaverList:${leaverList}, remover:${remover}, date:${date}`
    );
  })

  .on("room-topic", (room, newTopic, oldTopic, changer, date) => {
    log.info(
      LOGPRE,
      `on room-topic, room:${room}, newTopic:${newTopic}, oldTopic:${oldTopic}, changer:${changer}, date:${date}`
    );
  })

  .on("friendship", (friendship) => {
    log.info(LOGPRE, `on friendship: ${friendship}`);
  })

  .on("error", (error) => {
    log.error(LOGPRE, `on error: ${error}`);
  });

bot.start().then(() => {
  log.info(LOGPRE, "started.");
});
