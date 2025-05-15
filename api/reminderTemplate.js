const { format } = require('date-fns');

// 創建提醒列表訊息
function createReminderListMessage(reminders) {
  if (!reminders || reminders.length === 0) {
    return {
      type: 'text',
      text: '您目前沒有任何提醒。請使用「提醒我 明天下午3點 繳電話費」格式來新增提醒。'
    };
  }

  // 按時間排序提醒
  const sortedReminders = [...reminders].sort((a, b) => 
    new Date(a.dateTime) - new Date(b.dateTime)
  );

  const reminderContents = sortedReminders.map((reminder, index) => {
    const reminderDate = new Date(reminder.dateTime);
    const formattedDate = format(reminderDate, 'yyyy/MM/dd HH:mm');
    
    return {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          width: '70%',
          contents: [
            {
              type: 'text',
              text: reminder.title,
              weight: 'bold',
              size: 'sm',
              wrap: true
            },
            {
              type: 'text',
              text: formattedDate,
              size: 'xs',
              color: '#aaaaaa',
              margin: 'sm'
            }
          ]
        },
        {
          type: 'box',
          layout: 'vertical',
          width: '30%',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '刪除',
                data: `action=deleteReminder&id=${reminder.id}`,
                displayText: '刪除提醒'
              },
              style: 'link',
              color: '#ff5151',
              height: 'sm'
            }
          ],
          justifyContent: 'center',
          alignItems: 'center'
        }
      ],
      margin: 'lg',
      paddingAll: '10px',
      backgroundColor: reminder.isCompleted ? '#f5f5f5' : '#ffffff',
      cornerRadius: '5px',
      borderWidth: '1px',
      borderColor: '#dddddd'
    };
  });

  return {
    type: 'flex',
    altText: '提醒列表',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '您的提醒列表',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#4682B4'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: reminderContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'message',
              label: '新增提醒',
              text: '使用「提醒我 明天下午3點 繳電話費」的格式可以新增提醒'
            },
            style: 'primary'
          }
        ]
      }
    }
  };
}

// 創建提醒確認訊息
function createReminderConfirmationMessage(reminder) {
  const reminderDate = new Date(reminder.dateTime);
  const formattedDate = format(reminderDate, 'yyyy/MM/dd HH:mm');
  
  return {
    type: 'flex',
    altText: '提醒已新增',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '提醒已設定',
            weight: 'bold',
            size: 'xl',
            color: '#4682B4'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '內容:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: reminder.title,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '時間:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: formattedDate,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ],
                margin: 'md'
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'message',
              label: '查看所有提醒',
              text: '我的提醒'
            }
          }
        ],
        flex: 0
      }
    }
  };
}

// 創建提醒通知訊息
function createReminderNotificationMessage(reminder) {
  return {
    type: 'flex',
    altText: '提醒通知',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '提醒通知',
            weight: 'bold',
            color: '#1DB446',
            size: 'xl'
          },
          {
            type: 'text',
            text: reminder.title,
            weight: 'bold',
            size: 'xxl',
            margin: 'md',
            wrap: true
          },
          {
            type: 'text',
            text: '這是您之前設定的提醒事項',
            size: 'xs',
            color: '#aaaaaa',
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'message',
              label: '確認',
              text: '已確認提醒'
            },
            color: '#1DB446'
          }
        ],
        flex: 0
      }
    }
  };
}

// 創建提醒幫助訊息
function createReminderHelpMessage() {
  return {
    type: 'flex',
    altText: '提醒功能使用說明',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '提醒功能使用說明',
            weight: 'bold',
            size: 'xl',
            color: '#4682B4'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '設定提醒:',
                    weight: 'bold',
                    size: 'md'
                  },
                  {
                    type: 'text',
                    text: '提醒我 明天下午3點 繳電話費',
                    margin: 'sm',
                    size: 'sm',
                    color: '#666666'
                  },
                  {
                    type: 'text',
                    text: '提醒 後天上午9點 開會',
                    margin: 'sm',
                    size: 'sm',
                    color: '#666666'
                  },
                  {
                    type: 'text',
                    text: '提醒我 5/20 下午2點 去看醫生',
                    margin: 'sm',
                    size: 'sm',
                    color: '#666666'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '管理提醒:',
                    weight: 'bold',
                    size: 'md',
                    margin: 'xl'
                  },
                  {
                    type: 'text',
                    text: '我的提醒',
                    margin: 'sm',
                    size: 'sm',
                    color: '#666666'
                  },
                  {
                    type: 'text',
                    text: '刪除提醒 (在提醒列表中)',
                    margin: 'sm',
                    size: 'sm',
                    color: '#666666'
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            action: {
              type: 'message',
              label: '查看我的提醒',
              text: '我的提醒'
            },
            style: 'primary'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: '新增提醒範例',
              text: '提醒我 明天下午3點 繳電話費'
            },
            style: 'secondary',
            margin: 'md'
          }
        ],
        flex: 0
      }
    }
  };
}

module.exports = {
  createReminderListMessage,
  createReminderConfirmationMessage,
  createReminderNotificationMessage,
  createReminderHelpMessage
}; 