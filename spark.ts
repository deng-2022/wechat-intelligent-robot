import WebSocket from "ws";
import CryptoJS from "crypto-js";
import { Base64 } from "js-base64";

// 定义API Key和Access Token
let requestObj = {
  APPID: "fe2c4a11",
  APISecret: "",
  APIKey: "",
  Uid: "工作助手",
  sparkResult: "",
};

// 封装鉴权方法
function authenticate() {
  return new Promise((resolve, reject) => {
    var apiKey = "2523e8f0d30b56fe0ce00f7d2b8e3099";
    var apiSecret = "NDk3Njk2OGIwYTFlZDZiNWVlMWM1ZjVh";
    var url = "wss://spark-api.xf-yun.com/v1.1/chat";
    var host = "spark-api.xf-yun.com";
    var date = new Date().toUTCString();
    var algorithm = "hmac-sha256";
    var headers = "host date request-line";
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1.1/chat HTTP/1.1`;
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    var signature = CryptoJS.enc.Base64.stringify(signatureSha);
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    var authorization = btoa(authorizationOrigin);
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
    resolve(url);
  });
}

// 定义请求对话内容的方法
const sendMsg = async (inputVal: string, callback: (data: any) => void) => {
  // 获取请求地址
  let myUrl = await authenticate();
  // 获取输入框中的内容
  //   let inputVal = "评价一下秦始皇是不是一个好皇帝";
  // 每次发送问题 都是一个新的websocketqingqiu
  let socket = new WebSocket(String(myUrl));

  // 监听websocket的各阶段事件 并做相应处理
  socket.addEventListener("open", (event) => {
    console.log("开启连接！！", event);
    // 发送消息
    let params = {
      header: {
        app_id: requestObj.APPID,
        uid: "redrun",
      },

      parameter: {
        chat: {
          domain: "general",
          temperature: 0.5,
          max_tokens: 1024,
        },
      },

      payload: {
        message: {
          // 如果想获取结合上下文的回答，需要开发者每次将历史问答信息一起传给服务端，如下示例
          // 注意：text里面的所有content内容加一起的tokens需要控制在8192以内，开发者如有较长对话需求，需要适当裁剪历史信息
          text: [
            { role: "user", content: "你是谁" }, //# 用户的历史问题
            { role: "assistant", content: "我是AI助手" }, //# AI的历史回答结果
            // ....... 省略的历史对话
            { role: "user", content: inputVal }, //# 最新的一条问题，如无需上下文，可只传最新一条问题
          ],
        },
      },
    };

    requestObj.sparkResult = "";
    console.log("发送消息");
    socket.send(JSON.stringify(params));
  });

  socket.addEventListener("message", (event) => {
    let data = JSON.parse(String(event.data));
    console.log("收到消息！！", data);

    requestObj.sparkResult += data.payload.choices.text[0].content;
    if (data.header.code !== 0) {
      console.log("出错了", data.header.code, ":", data.header.message);
      // 出错了"手动关闭连接"
      socket.close();
    }

    if (data.header.code === 0) {
      // 对话已经完成
      if (data.payload.choices.text && data.header.status === 2) {
        requestObj.sparkResult += data.payload.choices.text[0].content;
        setTimeout(() => {
          // "对话完成，手动关闭连接"
          socket.close();
        }, 1000);
      }
    }

    //   console.log(requestObj.sparkResult);
  });

  socket.addEventListener("close", (event) => {
    console.log("连接关闭！！", event);
    // 对话完成后socket会关闭，将聊天记录换行处理
    // console.log(requestObj.sparkResult);
    callback(requestObj.sparkResult);
  });

  socket.addEventListener("error", (event) => {
    console.log("连接发送错误！！", event);
  });
};

export { sendMsg };
