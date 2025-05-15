const fs = require('fs').promises;
const path = require('path');

// 對話歷史存儲路徑
const CONVERSATION_DIR = path.join(__dirname, 'db', 'conversations');

// 確保存儲目錄存在
async function ensureDirectoryExists() {
  try {
    await fs.mkdir(CONVERSATION_DIR, { recursive: true });
  } catch (error) {
    console.error('確保目錄存在時出錯:', error);
    throw error;
  }
}

// 獲取用戶對話文件路徑
function getUserFilePath(userId) {
  return path.join(CONVERSATION_DIR, `${userId}.json`);
}

// 獲取用戶的對話歷史
async function getUserConversation(userId, maxMessages = 10) {
  await ensureDirectoryExists();
  const filePath = getUserFilePath(userId);
  
  try {
    const fileData = await fs.readFile(filePath, 'utf8');
    const conversation = JSON.parse(fileData);
    
    // 只返回最近的N條消息
    return conversation.slice(-maxMessages);
  } catch (error) {
    // 如果文件不存在或有其他問題，返回空數組
    return [];
  }
}

// 添加消息到用戶的對話歷史
async function addMessageToConversation(userId, role, text) {
  await ensureDirectoryExists();
  const filePath = getUserFilePath(userId);
  
  let conversation = [];
  try {
    const fileData = await fs.readFile(filePath, 'utf8');
    conversation = JSON.parse(fileData);
  } catch (error) {
    // 文件不存在或有其他問題，使用空數組
  }
  
  // 添加新消息
  conversation.push({
    role,
    text,
    timestamp: new Date().toISOString()
  });
  
  // 如果對話太長，只保留最近的20條消息
  if (conversation.length > 20) {
    conversation = conversation.slice(-20);
  }
  
  // 保存更新後的對話
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
  
  return conversation;
}

// 清除用戶的對話歷史
async function clearUserConversation(userId) {
  await ensureDirectoryExists();
  const filePath = getUserFilePath(userId);
  
  try {
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('清除用戶對話歷史時出錯:', error);
    return false;
  }
}

module.exports = {
  getUserConversation,
  addMessageToConversation,
  clearUserConversation
}; 