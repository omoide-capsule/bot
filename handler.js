'use strict';

const crypto = require('crypto');
const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});


module.exports.hello = (event, context) => {

  //署名検証
  let signature = crypto.createHmac('sha256', process.env.CHANNELSECRET).update(event.body).digest('base64');
  let checkHeader = (event.headers || {})['X-Line-Signature'];

  const events = JSON.parse(event.body).events;
  let message;
  if (signature === checkHeader) {
    events.forEach(async function (event) {
      switch (event.type) {
        case 'message':
          message = await messageFunc(event);
          break;
        case 'postback':
          message = await postbackFunc(event);
          break;
        case 'follow':
          message = {
            'type': 'text',
            'text': '友達登録ありがとうございます！\n\n思い出カプセルはあなたが登録した思い出を数年後の未来に送信します📡🌃\n\n思い出を登録するには、画面下部にある「メニュー」をタップしてメニューを開いて「思い出を記録する」を選択してください。\n\nグループに招待することでそのグループでもご利用いただけます。'
          };
          break;
      }
      console.log(`46${message}`);
      if (message != undefined) {
        console.log(`message: ${JSON.stringify(message)}`);
        client.replyMessage(event.replyToken, message)
          .then((response) => {
            let lambdaResponse = {
              statusCode: 200,
              headers: {
                'X-Line-Status': 'OK'
              },
              body: '{"result":"completed"}'
            };
            context.succeed(lambdaResponse);
          }).catch((err) => console.log(`${JSON.stringify(message)}\n\n\n${err}`));
      }
    });
  } else {
    console.log('署名認証エラー');
  }

  async function messageFunc(e) {
    const userMessage = e.message.text;
    let message;
    if (e.source.type === 'group') {
      switch (userMessage) {
        case '思い出カプセルを起動':
          message = [{
              'type': 'text',
              'text': '思い出カプセルを起動しました'
            },
            require('./messages/groupMenu.json')
          ];
          break;

        default:
          break;
      }
      return message;
    }
    switch (userMessage) {
      case 'メニュー':
        message = require('./messages/groupMenu.json');
        break;

      default:
        break;
    }
    return message;
  };

  async function postbackFunc(e) {
    const data = e.postback.data;
    console.log(data);
    let message;
    switch (data) {
      case 'other':
        message = require('./messages/otherMenu.json');
        break;
      case 'howtouse':
        message = {
          'type': 'text',
          'text': '思い出カプセルを作成するには、画面下部にある「メニュー」をタップしてメニューを開いて「思い出を記録する」を選択してください。記録した思い出を見るには「一覧を見る」を選択してください。\n\nグループで使用する場合は、「思い出カプセルを起動」とメッセージを送信するとメニューが表示されます。'
        };
        break;
      case 'invite':
        message = require('./messages/invite.json');
        break;
      case 'creators':
        message = require('./messages/creators.json');
        break;
      default:
        break;
    }
    return message;
  };

};