import Database, { type Database as SQLiteDB } from 'better-sqlite3';
import path from 'path';
import DBMessages, { DBUIMessage } from './tables/messages.js';
import DBChats, { DBUIChat } from './tables/chats.js';
import { randomUUID } from 'crypto';

export default class DB {
  private static instance: DB | undefined;
  private db: SQLiteDB;
  private dbPath: string;
  private chatsTable: DBChats;
  private messagesTable: DBMessages;

  private constructor(private dataDir: string) {
    console.log('Initializing database at', dataDir);
    this.dbPath = path.join(this.dataDir, 'sqlite.db');
    this.db = new Database(this.dbPath);

    // Use WAL for better concurrency (optional)
    this.db.pragma('journal_mode = WAL');
    this.chatsTable = new DBChats(this.db);
    this.messagesTable = new DBMessages(this.db);
  }

  static getInstance(dataDir: string): DB {
    if (!DB.instance) {
      DB.instance = new DB(dataDir);
    }
    return DB.instance;
  }

  close() {
    this.db.close();
    DB.instance = undefined;
  }

  addMessageToChat(chatId: string, message: DBUIMessage, idx?: number): string {
    this.ensureChatExists(chatId);
    this.chatsTable.chatUpdated(chatId);
    message = this.ensureChatMessageHasId(message);
    if (this.messagesTable.exists(chatId, message.id)) {
      return message.id;
    }
    return this.messagesTable.add(chatId, message, idx);
  }

  addMessagesToChat(chatId: string, messages: DBUIMessage[]): string[] {
    this.ensureChatExists(chatId);
    this.chatsTable.chatUpdated(chatId);
    return this.messagesTable.addMultiple(
      chatId,
      messages.map((msg) => this.ensureChatMessageHasId(msg)),
    );
  }

  getMessagesForChat(chatId: string): DBUIMessage[] {
    return this.messagesTable.get(chatId);
  }

  createChat(): string {
    const chatId = randomUUID();
    this.chatsTable.create({ id: chatId, title: null });
    return chatId;
  }

  deleteChat(chatId: string): void {
    this.messagesTable.deleteMessagesByChat(chatId);
    this.chatsTable.delete(chatId);
  }

  listChats(): DBUIChat[] {
    return this.chatsTable.getAll();
  }

  getChat(chatId: string): DBUIChat | undefined {
    return this.chatsTable.getById(chatId);
  }

  updateChatTitle(chatId: string, title: string): DBUIChat {
    const chat = this.chatsTable.update(chatId, { title });
    if (!chat) {
      throw new Error(`Chat with id ${chatId} does not exist`);
    }
    return chat;
  }

  private ensureChatMessageHasId(message: DBUIMessage): DBUIMessage {
    if (!message.id) {
      message.id = randomUUID();
    }
    return message;
  }

  private ensureChatExists(chatId: string): void {
    const chat = this.chatsTable.getById(chatId);
    if (!chat) {
      this.chatsTable.create({ id: chatId, title: null });
    }
  }
}
