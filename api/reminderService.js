const fs = require('fs').promises;
const path = require('path');
const { format, parse, isAfter, isBefore, addMinutes } = require('date-fns');
const cron = require('node-cron');

// 提醒資料庫檔案路徑
const REMINDERS_FILE = path.join(__dirname, 'db', 'reminders.json');

// 確保檔案和目錄存在
async function ensureFileExists() {
  try {
    const dbDir = path.dirname(REMINDERS_FILE);
    await fs.mkdir(dbDir, { recursive: true });
    
    try {
      await fs.access(REMINDERS_FILE);
    } catch (error) {
      // 如果檔案不存在，建立空的提醒陣列
      await fs.writeFile(REMINDERS_FILE, JSON.stringify({ reminders: [] }, null, 2), 'utf8');
    }
  } catch (error) {
    console.error('確保檔案存在時出錯:', error);
    throw error;
  }
}

// 讀取所有提醒
async function getReminders() {
  await ensureFileExists();
  
  try {
    const data = await fs.readFile(REMINDERS_FILE, 'utf8');
    return JSON.parse(data).reminders || [];
  } catch (error) {
    console.error('讀取提醒時出錯:', error);
    return [];
  }
}

// 根據用戶ID取得提醒
async function getUserReminders(userId) {
  const reminders = await getReminders();
  return reminders.filter(reminder => reminder.userId === userId);
}

// 保存所有提醒
async function saveReminders(reminders) {
  await ensureFileExists();
  
  try {
    await fs.writeFile(REMINDERS_FILE, JSON.stringify({ reminders }, null, 2), 'utf8');
  } catch (error) {
    console.error('保存提醒時出錯:', error);
    throw error;
  }
}

// 新增提醒
async function addReminder(userId, title, dateTime, notes = '') {
  const reminders = await getReminders();
  
  const newReminder = {
    id: Date.now().toString(),
    userId,
    title,
    dateTime,
    notes,
    isCompleted: false,
    createdAt: new Date().toISOString()
  };
  
  reminders.push(newReminder);
  await saveReminders(reminders);
  
  return newReminder;
}

// 刪除提醒
async function deleteReminder(userId, reminderId) {
  let reminders = await getReminders();
  const originalLength = reminders.length;
  
  // 篩選掉要刪除的提醒，確保只能刪除自己的提醒
  reminders = reminders.filter(reminder => 
    !(reminder.id === reminderId && reminder.userId === userId)
  );
  
  // 如果長度沒變，表示沒有找到符合條件的提醒
  if (reminders.length === originalLength) {
    return false;
  }
  
  await saveReminders(reminders);
  return true;
}

// 更新提醒狀態
async function updateReminderStatus(userId, reminderId, isCompleted) {
  const reminders = await getReminders();
  const reminder = reminders.find(r => r.id === reminderId && r.userId === userId);
  
  if (!reminder) {
    return null;
  }
  
  reminder.isCompleted = isCompleted;
  await saveReminders(reminders);
  
  return reminder;
}

// 檢查即將到期的提醒 (在15分鐘內到期的)
async function checkUpcomingReminders(notifyCallback) {
  const reminders = await getReminders();
  const now = new Date();
  const upcoming = reminders.filter(reminder => {
    if (reminder.isCompleted) return false;
    
    const reminderTime = new Date(reminder.dateTime);
    const fifteenMinutesFromNow = addMinutes(now, 15);
    
    // 檢查提醒時間是否在當前時間之後，且在15分鐘之內
    return isAfter(reminderTime, now) && isBefore(reminderTime, fifteenMinutesFromNow);
  });
  
  // 對於每個即將到期的提醒，執行回調通知
  for (const reminder of upcoming) {
    await notifyCallback(reminder);
    // 標記為已完成，避免重複通知
    await updateReminderStatus(reminder.userId, reminder.id, true);
  }
}

// 解析提醒文本（如："提醒我 明天下午3點 繳電話費"）
function parseReminderText(text) {
  // 移除"提醒我"或"提醒"前綴
  let content = text.replace(/^(提醒我|提醒)\s+/, '').trim();
  
  // 簡單的時間表達式處理
  const timePatterns = [
    // 明天/後天 + 時間
    { regex: /(明天|後天)(上午|下午)?\s*(\d{1,2})([點時:])?(\d{0,2})?\s*(.+)/, 
      handler: (matches) => {
        const dayOffset = matches[1] === '明天' ? 1 : 2;
        const isPM = matches[2] === '下午';
        let hour = parseInt(matches[3]);
        if (isPM && hour < 12) hour += 12;
        const minute = matches[5] ? parseInt(matches[5]) : 0;
        
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        date.setHours(hour, minute, 0, 0);
        
        return {
          dateTime: date.toISOString(),
          title: matches[6].trim()
        };
      }
    },
    // MM/DD 或 MM-DD + 時間
    { regex: /(\d{1,2})[\/\-](\d{1,2})\s*(上午|下午)?\s*(\d{1,2})([點時:])?(\d{0,2})?\s*(.+)/,
      handler: (matches) => {
        const month = parseInt(matches[1]) - 1; // 月份從0開始
        const day = parseInt(matches[2]);
        const isPM = matches[3] === '下午';
        let hour = parseInt(matches[4]);
        if (isPM && hour < 12) hour += 12;
        const minute = matches[6] ? parseInt(matches[6]) : 0;
        
        const date = new Date();
        date.setMonth(month, day);
        // 如果設定的日期已經過了，則假設是明年的這一天
        if (date < new Date()) {
          date.setFullYear(date.getFullYear() + 1);
        }
        date.setHours(hour, minute, 0, 0);
        
        return {
          dateTime: date.toISOString(),
          title: matches[7].trim()
        };
      }
    }
  ];
  
  // 嘗試匹配各種模式
  for (const pattern of timePatterns) {
    const matches = content.match(pattern.regex);
    if (matches) {
      return pattern.handler(matches);
    }
  }
  
  // 如果沒有匹配到任何時間模式，返回null
  return null;
}

// 啟動提醒檢查排程（每分鐘檢查一次）
function startReminderChecker(notifyCallback) {
  return cron.schedule('* * * * *', async () => {
    try {
      await checkUpcomingReminders(notifyCallback);
    } catch (error) {
      console.error('檢查提醒時出錯:', error);
    }
  });
}

module.exports = {
  getReminders,
  getUserReminders,
  addReminder,
  deleteReminder,
  updateReminderStatus,
  parseReminderText,
  startReminderChecker
}; 