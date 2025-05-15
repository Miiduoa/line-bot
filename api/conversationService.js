// 為了避免在Vercel無狀態環境中使用文件系統問題，使用內存映射
const conversationMap = new Map();

// 每個用戶對話的最大消息數
const MAX_MESSAGES = 15;

// 獲取用戶的對話歷史
async function getUserConversation(userId, maxMessages = 10) {
  // 如果該用戶沒有對話歷史，返回空數組
  if (!conversationMap.has(userId)) {
    return [];
  }
  
  const conversation = conversationMap.get(userId);
  
  // 只返回最近的N條消息
  return conversation.slice(-maxMessages);
}

// 添加消息到用戶的對話歷史
async function addMessageToConversation(userId, role, text) {
  // 如果該用戶沒有對話歷史，創建一個空數組
  if (!conversationMap.has(userId)) {
    conversationMap.set(userId, []);
  }
  
  const conversation = conversationMap.get(userId);
  
  // 添加新消息
  conversation.push({
    role,
    text,
    timestamp: new Date().toISOString()
  });
  
  // 如果對話太長，只保留最近的消息
  if (conversation.length > MAX_MESSAGES) {
    conversationMap.set(userId, conversation.slice(-MAX_MESSAGES));
  }
  
  return conversation;
}

// 清除用戶的對話歷史
async function clearUserConversation(userId) {
  conversationMap.set(userId, []);
  return true;
}

module.exports = {
  getUserConversation,
  addMessageToConversation,
  clearUserConversation
}; 