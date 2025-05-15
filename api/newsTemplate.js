const { format } = require('date-fns');

// 創建新聞列表訊息
function createNewsListMessage(articles, title = '今日新聞摘要') {
  if (!articles || articles.length === 0) {
    return {
      type: 'text',
      text: '找不到相關新聞，請稍後再試。'
    };
  }

  // 只取前5篇文章
  const newsArticles = articles.slice(0, 5);

  const newsContents = newsArticles.map((article, index) => {
    // 格式化日期
    let publishedDate;
    try {
      publishedDate = article.publishedAt ? format(new Date(article.publishedAt), 'yyyy/MM/dd HH:mm') : '';
    } catch (e) {
      publishedDate = '';
    }

    return {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${index + 1}. ${article.title}`,
          weight: 'bold',
          size: 'sm',
          wrap: true
        },
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: article.source?.name || '未知來源',
              size: 'xs',
              color: '#aaaaaa',
              margin: 'md',
              flex: 0
            },
            {
              type: 'text',
              text: publishedDate,
              size: 'xs',
              color: '#aaaaaa',
              align: 'end',
              flex: 2
            }
          ],
          margin: 'sm'
        },
        {
          type: 'text',
          text: article.description || '無摘要',
          size: 'xs',
          color: '#666666',
          wrap: true,
          margin: 'sm'
        },
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '閱讀全文',
            uri: article.url
          },
          style: 'link',
          height: 'sm',
          margin: 'sm'
        },
        {
          type: 'separator',
          margin: 'sm'
        }
      ],
      paddingAll: '10px'
    };
  });

  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#2E8B57'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: newsContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '資料來源: NewsAPI',
            size: 'xs',
            color: '#aaaaaa',
            align: 'center'
          }
        ]
      }
    }
  };
}

// 創建新聞分類選單
function createNewsCategoryMenu() {
  return {
    type: 'flex',
    altText: '新聞分類選單',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '選擇新聞分類',
            weight: 'bold',
            size: 'xl',
            color: '#2E8B57',
            align: 'center'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'message',
                  label: '頭條新聞',
                  text: '新聞 頭條'
                },
                style: 'primary',
                color: '#2E8B57'
              },
              {
                type: 'button',
                action: {
                  type: 'message',
                  label: '科技新聞',
                  text: '新聞 科技'
                },
                style: 'secondary',
                margin: 'md'
              },
              {
                type: 'button',
                action: {
                  type: 'message',
                  label: '商業新聞',
                  text: '新聞 商業'
                },
                style: 'secondary',
                margin: 'md'
              },
              {
                type: 'button',
                action: {
                  type: 'message',
                  label: '娛樂新聞',
                  text: '新聞 娛樂'
                },
                style: 'secondary',
                margin: 'md'
              },
              {
                type: 'button',
                action: {
                  type: 'message',
                  label: '體育新聞',
                  text: '新聞 體育'
                },
                style: 'secondary',
                margin: 'md'
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '也可以直接搜尋：新聞搜尋 [關鍵字]',
            size: 'xs',
            color: '#aaaaaa',
            align: 'center',
            wrap: true
          }
        ]
      }
    }
  };
}

// 創建新聞幫助訊息
function createNewsHelpMessage() {
  return {
    type: 'flex',
    altText: '新聞功能使用說明',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '新聞功能使用說明',
            weight: 'bold',
            size: 'xl',
            color: '#2E8B57'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '瀏覽新聞:',
                weight: 'bold',
                size: 'md'
              },
              {
                type: 'text',
                text: '新聞',
                margin: 'sm',
                size: 'sm',
                color: '#666666'
              },
              {
                type: 'text',
                text: '新聞 頭條',
                margin: 'sm',
                size: 'sm',
                color: '#666666'
              },
              {
                type: 'text',
                text: '新聞 [類別]',
                margin: 'sm',
                size: 'sm',
                color: '#666666'
              },
              {
                type: 'text',
                text: '可用類別：科技、商業、娛樂、體育、健康、科學',
                margin: 'sm',
                size: 'xs',
                color: '#aaaaaa',
                wrap: true
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '搜尋新聞:',
                weight: 'bold',
                size: 'md'
              },
              {
                type: 'text',
                text: '新聞搜尋 [關鍵字]',
                margin: 'sm',
                size: 'sm',
                color: '#666666'
              },
              {
                type: 'text',
                text: '例如：新聞搜尋 台積電',
                margin: 'sm',
                size: 'sm',
                color: '#666666'
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
              label: '瀏覽新聞分類',
              text: '新聞'
            },
            style: 'primary',
            color: '#2E8B57'
          }
        ],
        flex: 0
      }
    }
  };
}

module.exports = {
  createNewsListMessage,
  createNewsCategoryMenu,
  createNewsHelpMessage
}; 