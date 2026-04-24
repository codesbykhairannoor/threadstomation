import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'd:/User_Axioo/Downloads/automation-socmed/data/database.sqlite');
const db = new sqlite3(dbPath);

async function checkModels() {
  const apiKey = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get()?.value;
  if (!apiKey) {
    console.error('API Key not found in DB');
    return;
  }

  console.log('--- CHECKING AVAILABLE GEMINI MODELS ---');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }

    console.log('Verified Models Available for your Key:');
    data.models.forEach(m => {
       if (m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name.replace('models/', '')}`);
       }
    });
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

checkModels();
